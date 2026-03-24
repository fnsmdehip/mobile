/**
 * Export & Sharing Service for cnsnt app.
 *
 * - Generates real PDFs from professional HTML templates
 * - Includes: header with branding, parties, consent text,
 *   signature images, date/time, SHA-256 hash at bottom
 * - Hash in PDF matches what is stored on the record
 * - Share via email/airdrop using expo-sharing
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import vault from './encryption';
import type { ConsentRecord } from '../types';

/**
 * Escape HTML entities to prevent XSS in generated PDFs.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert markdown-like consent text to HTML.
 * Handles headers (#, ##, ###), bold (**text**), lists (- item), and paragraphs.
 */
function markdownToHtml(text: string): string {
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h4 style="font-size:13px;color:#333;margin:12px 0 4px 0;font-weight:600;">${escapeHtml(trimmed.slice(4))}</h4>`;
    } else if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3 style="font-size:15px;color:#222;margin:16px 0 6px 0;font-weight:600;">${escapeHtml(trimmed.slice(3))}</h3>`;
    } else if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2 style="font-size:18px;color:#111;margin:20px 0 8px 0;font-weight:700;">${escapeHtml(trimmed.slice(2))}</h2>`;
    } else if (trimmed.startsWith('- ')) {
      if (!inList) { html += '<ul style="margin:4px 0;padding-left:20px;">'; inList = true; }
      const itemText = trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html += `<li style="font-size:13px;color:#444;margin-bottom:4px;">${itemText}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      const processed = escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html += `<p style="font-size:13px;color:#444;margin:4px 0;line-height:1.6;">${processed}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

/**
 * Generate a professional HTML document from a consent record for PDF export.
 * Includes: branded header, parties table, full consent text, signature images,
 * date/timestamps, and SHA-256 integrity hash footer.
 */
function generateConsentHtml(record: ConsentRecord): string {
  const statusColors: Record<string, string> = {
    active: '#10B981',
    expired: '#F59E0B',
    revoked: '#EF4444',
    draft: '#94A3B8',
  };

  const statusColor = statusColors[record.status] || '#94A3B8';

  const partiesHtml = record.parties
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#1A202C;">${escapeHtml(p.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;">${escapeHtml(p.role)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;">${p.email ? escapeHtml(p.email) : '---'}</td>
      </tr>`
    )
    .join('');

  const signaturesHtml = record.signatures
    .map(
      (s) => `
      <div style="display:inline-block;width:45%;vertical-align:top;margin-bottom:16px;margin-right:4%;">
        <p style="font-weight:600;font-size:13px;color:#1A202C;margin:0 0 8px 0;">${escapeHtml(s.partyName)}</p>
        <div style="border:1px solid #E2E8F0;border-radius:6px;padding:8px;background:#FAFBFC;margin-bottom:6px;">
          ${s.signatureImage.startsWith('data:')
            ? `<img src="${s.signatureImage}" style="max-width:100%;height:80px;display:block;" />`
            : `<div style="height:80px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:12px;">[Signature on file]</div>`
          }
        </div>
        <p style="font-size:11px;color:#94A3B8;margin:0;">Signed: ${new Date(s.timestamp).toLocaleString()}</p>
      </div>`
    )
    .join('');

  const consentTextHtml = markdownToHtml(record.consentText);

  const createdDate = new Date(record.createdAt);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = createdDate.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      max-width: 780px;
      margin: 0 auto;
      padding: 40px 48px;
      color: #1A202C;
      line-height: 1.5;
      font-size: 13px;
    }
    .header {
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .logo-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      color: #3B82F6;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 400;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: white;
      background-color: ${statusColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #1A202C;
      margin: 0 0 4px 0;
    }
    .doc-meta {
      font-size: 12px;
      color: #64748B;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #F1F5F9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 8px 12px;
      background: #F8FAFC;
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .consent-text-box {
      background: #F8FAFC;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    }
    .validity-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #92400E;
    }
    .revoked-box {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #B91C1C;
    }
    .hash-footer {
      margin-top: 36px;
      padding: 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
    }
    .hash-title {
      font-size: 11px;
      font-weight: 700;
      color: #10B981;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 8px 0;
    }
    .hash-value {
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 11px;
      color: #475569;
      word-break: break-all;
      line-height: 1.8;
      background: #FFFFFF;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #E2E8F0;
    }
    .hash-note {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 8px;
      line-height: 1.5;
    }
    .record-info {
      display: flex;
      gap: 24px;
      margin-top: 10px;
      font-size: 11px;
      color: #94A3B8;
    }
    .watermark {
      text-align: center;
      font-size: 10px;
      color: #CBD5E1;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #F1F5F9;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="logo-row">
      <div>
        <div class="brand">cnsnt</div>
        <div class="brand-sub">Secure Consent Management</div>
      </div>
      <span class="status-badge">${record.status.toUpperCase()}</span>
    </div>
    <h1 class="doc-title">${escapeHtml(record.title)}</h1>
    <div class="doc-meta">
      ${escapeHtml(record.templateName)} &nbsp;&bull;&nbsp; ${formattedDate} at ${formattedTime}
    </div>
  </div>

  <!-- PARTIES -->
  <div class="section">
    <h2 class="section-title">Parties Involved</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        ${partiesHtml}
      </tbody>
    </table>
  </div>

  <!-- CONSENT TEXT -->
  <div class="section">
    <h2 class="section-title">Consent Agreement</h2>
    <div class="consent-text-box">
      ${consentTextHtml}
    </div>
  </div>

  <!-- VALIDITY / EXPIRY -->
  ${record.expiresAt ? `
  <div class="section">
    <h2 class="section-title">Validity Period</h2>
    <div class="validity-box">
      Effective from <strong>${new Date(record.createdAt).toLocaleDateString()}</strong>
      to <strong>${new Date(record.expiresAt).toLocaleDateString()}</strong>
    </div>
  </div>
  ` : ''}

  <!-- REVOCATION -->
  ${record.revokedAt ? `
  <div class="section">
    <h2 class="section-title">Revocation Notice</h2>
    <div class="revoked-box">
      This consent was <strong>revoked</strong> on ${new Date(record.revokedAt).toLocaleDateString()}.
      The record hash has been recomputed to reflect this modification.
    </div>
  </div>
  ` : ''}

  <!-- SIGNATURES -->
  <div class="section">
    <h2 class="section-title">Signatures (${record.signatures.length})</h2>
    <div>
      ${signaturesHtml}
    </div>
  </div>

  <!-- AUDIO RECORDING -->
  ${record.recordingUri ? `
  <div class="section">
    <h2 class="section-title">Audio Recording</h2>
    <div class="validity-box">
      An audio recording${record.recordingDuration ? ` (${Math.round(record.recordingDuration)}s)` : ''} is stored
      locally on device and associated with this consent record.
    </div>
  </div>
  ` : ''}

  <!-- SHA-256 INTEGRITY HASH -->
  <div class="hash-footer">
    <div class="hash-title">Document Integrity Verification (SHA-256)</div>
    <div class="hash-value">${record.documentHash || 'Hash not computed'}</div>
    <div class="hash-note">
      This cryptographic hash covers all form fields, signatures, timestamps, and metadata.
      To verify integrity, recompute SHA-256 over the canonical record payload and compare.
      If even one character has been modified, the hash will not match.
    </div>
    <div class="record-info">
      <span><strong>Record ID:</strong> ${record.id}</span>
      <span><strong>PDF Generated:</strong> ${new Date().toISOString()}</span>
    </div>
  </div>

  <div class="watermark">
    Generated by cnsnt &mdash; Secure Consent Management &mdash; Tamper-proof verification enabled
  </div>
</body>
</html>`;
}

class ExportService {
  /**
   * Export a consent record as a PDF file.
   * Returns the local URI of the generated PDF.
   */
  async exportToPdf(record: ConsentRecord): Promise<string> {
    const html = generateConsentHtml(record);
    const { uri } = await Print.printToFileAsync({
      html,
      width: 612, // Letter width in points
      height: 792, // Letter height in points
    });

    // Rename to a meaningful filename
    const safeName = record.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const newFilename = `cnsnt_${safeName}_${timestamp}.pdf`;
    const newUri = `${FileSystem.cacheDirectory}${newFilename}`;

    await FileSystem.moveAsync({ from: uri, to: newUri });
    return newUri;
  }

  /**
   * Export and share a consent record.
   */
  async exportAndShare(record: ConsentRecord): Promise<void> {
    const pdfUri = await this.exportToPdf(record);

    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Consent Record: ${record.title}`,
      UTI: 'com.adobe.pdf',
    });
  }

  /**
   * Export all records as a single JSON file for backup.
   */
  async exportAllAsJson(records: ConsentRecord[]): Promise<string> {
    const json = JSON.stringify(records, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `cnsnt_backup_${timestamp}.json`;
    const uri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, json);
    return uri;
  }

  /**
   * Share an exported file.
   */
  async shareFile(uri: string, mimeType: string = 'application/json'): Promise<void> {
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Share cnsnt Data',
    });
  }

  /**
   * Compute SHA-256 hash of a document for tamper detection.
   */
  async computeDocumentHash(record: ConsentRecord): Promise<string> {
    const content = JSON.stringify({
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
    return vault.sha256(content);
  }
}

export const exportService = new ExportService();
export default exportService;
