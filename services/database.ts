/**
 * Encrypted database service for cnsnt app.
 *
 * All consent records are stored encrypted via the vault.
 * Provides CRUD operations, search, and filtering.
 * SHA-256 integrity hashing covers ALL form fields + signatures + timestamps + metadata.
 */

import vault from './encryption';
import type { ConsentRecord, ConsentStatus } from '../types';

const RECORDS_INDEX_KEY = 'consent_records_index';

/**
 * Get the index of all record IDs.
 */
async function getIndex(): Promise<string[]> {
  try {
    const data = await vault.retrieveAndDecrypt(RECORDS_INDEX_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save the record index.
 */
async function saveIndex(ids: string[]): Promise<void> {
  await vault.encryptAndStore(RECORDS_INDEX_KEY, JSON.stringify(ids));
}

/**
 * Generate a unique ID.
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `cr_${timestamp}_${random}`;
}

/**
 * Compute a canonical hash payload from a consent record.
 * Includes ALL fields that matter for integrity: form fields, signatures,
 * timestamps, parties, consent text, status, metadata, and expiry info.
 * The hash changes if ANY of these fields are modified.
 */
function buildHashPayload(record: ConsentRecord): string {
  return JSON.stringify({
    templateId: record.templateId,
    templateName: record.templateName,
    title: record.title,
    status: record.status,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    parties: record.parties,
    consentText: record.consentText,
    signatures: record.signatures.map((s) => ({
      partyName: s.partyName,
      signatureImage: s.signatureImage,
      timestamp: s.timestamp,
    })),
    metadata: record.metadata,
  });
}

class DatabaseService {
  /**
   * Compute SHA-256 hash of a record's canonical content.
   * Exported so other modules (PDF, preview) can recompute and verify.
   */
  async computeRecordHash(record: ConsentRecord): Promise<string> {
    const payload = buildHashPayload(record);
    return vault.sha256(payload);
  }

  /**
   * Create a new consent record.
   */
  async createRecord(
    record: Omit<ConsentRecord, 'id'>
  ): Promise<ConsentRecord> {
    const id = generateId();
    const fullRecord: ConsentRecord = { ...record, id };

    // Generate SHA-256 hash over ALL form fields + signatures + timestamp + metadata
    fullRecord.documentHash = await this.computeRecordHash(fullRecord);

    await vault.encryptAndStore(
      `record_${id}`,
      JSON.stringify(fullRecord)
    );

    const index = await getIndex();
    index.unshift(id); // newest first
    await saveIndex(index);

    return fullRecord;
  }

  /**
   * Get a single consent record by ID.
   */
  async getRecord(id: string): Promise<ConsentRecord | null> {
    try {
      const data = await vault.retrieveAndDecrypt(`record_${id}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Update an existing consent record.
   * Recomputes the SHA-256 hash over all fields so the hash
   * reflects the current state (e.g. after revocation).
   */
  async updateRecord(
    id: string,
    updates: Partial<ConsentRecord>
  ): Promise<ConsentRecord | null> {
    const existing = await this.getRecord(id);
    if (!existing) return null;

    const updated: ConsentRecord = { ...existing, ...updates, id };

    // Recompute SHA-256 over all canonical fields
    updated.documentHash = await this.computeRecordHash(updated);

    await vault.encryptAndStore(
      `record_${id}`,
      JSON.stringify(updated)
    );

    return updated;
  }

  /**
   * Delete a consent record.
   */
  async deleteRecord(id: string): Promise<void> {
    await vault.deleteRecord(`record_${id}`);
    const index = await getIndex();
    const filtered = index.filter((i) => i !== id);
    await saveIndex(filtered);
  }

  /**
   * Get all consent records.
   */
  async getAllRecords(): Promise<ConsentRecord[]> {
    const index = await getIndex();
    const records: ConsentRecord[] = [];

    for (const id of index) {
      const record = await this.getRecord(id);
      if (record) {
        // Auto-update status based on expiry
        if (
          record.status === 'active' &&
          record.expiresAt &&
          new Date(record.expiresAt) < new Date()
        ) {
          record.status = 'expired';
          await this.updateRecord(id, { status: 'expired' });
        }
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Get records filtered by status.
   */
  async getRecordsByStatus(
    status: ConsentStatus
  ): Promise<ConsentRecord[]> {
    const all = await this.getAllRecords();
    return all.filter((r) => r.status === status);
  }

  /**
   * Search records by title or party name.
   */
  async searchRecords(query: string): Promise<ConsentRecord[]> {
    const all = await this.getAllRecords();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.templateName.toLowerCase().includes(lowerQuery) ||
        r.parties.some((p) =>
          p.name.toLowerCase().includes(lowerQuery)
        )
    );
  }

  /**
   * Get record count.
   */
  async getRecordCount(): Promise<number> {
    const index = await getIndex();
    return index.length;
  }

  /**
   * Get dashboard statistics.
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    draft: number;
    expiringSoon: number;
    recentlyCreated: number;
  }> {
    const all = await this.getAllRecords();
    const now = new Date();
    const sevenDaysFromNow = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    return {
      total: all.length,
      active: all.filter((r) => r.status === 'active').length,
      expired: all.filter((r) => r.status === 'expired').length,
      revoked: all.filter((r) => r.status === 'revoked').length,
      draft: all.filter((r) => r.status === 'draft').length,
      expiringSoon: all.filter(
        (r) =>
          r.status === 'active' &&
          r.expiresAt &&
          new Date(r.expiresAt) <= sevenDaysFromNow &&
          new Date(r.expiresAt) > now
      ).length,
      recentlyCreated: all.filter(
        (r) => new Date(r.createdAt) >= sevenDaysAgo
      ).length,
    };
  }

  /**
   * Revoke a consent record.
   */
  async revokeRecord(id: string): Promise<ConsentRecord | null> {
    return this.updateRecord(id, {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
    });
  }

  /**
   * Verify a record's integrity by recomputing SHA-256 from all fields
   * and comparing against the stored hash. Returns { verified, storedHash, computedHash }.
   */
  async verifyRecordIntegrity(
    id: string
  ): Promise<{ verified: boolean; storedHash: string | null; computedHash: string | null }> {
    const record = await this.getRecord(id);
    if (!record || !record.documentHash) {
      return { verified: false, storedHash: null, computedHash: null };
    }

    const computedHash = await this.computeRecordHash(record);
    return {
      verified: computedHash === record.documentHash,
      storedHash: record.documentHash,
      computedHash,
    };
  }

  /**
   * Simple boolean integrity check (backward compat).
   */
  async isRecordIntact(id: string): Promise<boolean> {
    const result = await this.verifyRecordIntegrity(id);
    return result.verified;
  }

  /**
   * Delete all records.
   */
  async deleteAllRecords(): Promise<void> {
    const index = await getIndex();
    for (const id of index) {
      await vault.deleteRecord(`record_${id}`);
    }
    await saveIndex([]);
  }

  /**
   * Export all records as a JSON string (for backup).
   */
  async exportAllAsJson(): Promise<string> {
    const records = await this.getAllRecords();
    return JSON.stringify(records, null, 2);
  }
}

export const db = new DatabaseService();
export default db;
