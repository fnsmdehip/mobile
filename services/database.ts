/**
 * Encrypted database service for cnsnt app.
 *
 * All consent records are stored encrypted via the vault.
 * Provides CRUD operations, search, and filtering.
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

class DatabaseService {
  /**
   * Create a new consent record.
   */
  async createRecord(
    record: Omit<ConsentRecord, 'id'>
  ): Promise<ConsentRecord> {
    const id = generateId();
    const fullRecord: ConsentRecord = { ...record, id };

    // Generate document hash for tamper detection
    const hashContent = JSON.stringify({
      title: fullRecord.title,
      consentText: fullRecord.consentText,
      parties: fullRecord.parties,
      signatures: fullRecord.signatures,
      createdAt: fullRecord.createdAt,
    });
    fullRecord.documentHash = await vault.sha256(hashContent);

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
   */
  async updateRecord(
    id: string,
    updates: Partial<ConsentRecord>
  ): Promise<ConsentRecord | null> {
    const existing = await this.getRecord(id);
    if (!existing) return null;

    const updated: ConsentRecord = { ...existing, ...updates, id };

    // Recompute document hash
    const hashContent = JSON.stringify({
      title: updated.title,
      consentText: updated.consentText,
      parties: updated.parties,
      signatures: updated.signatures,
      createdAt: updated.createdAt,
    });
    updated.documentHash = await vault.sha256(hashContent);

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
   * Verify a record's integrity hash.
   */
  async verifyRecordIntegrity(
    id: string
  ): Promise<boolean> {
    const record = await this.getRecord(id);
    if (!record || !record.documentHash) return false;

    const hashContent = JSON.stringify({
      title: record.title,
      consentText: record.consentText,
      parties: record.parties,
      signatures: record.signatures,
      createdAt: record.createdAt,
    });
    const currentHash = await vault.sha256(hashContent);

    return currentHash === record.documentHash;
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
