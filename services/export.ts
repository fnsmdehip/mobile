/**
 * Export & Sharing Service for cnsnt app.
 *
 * - Export consent records as signed PDFs
 * - Include consent text, signatures, timestamps, recording reference
 * - SHA-256 hash for tamper detection
 * - Share via email/airdrop using expo-sharing
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import vault from './encryption';
import type { ConsentRecord } from '../types';

/**
 * Generate an HTML document from a consent record for PDF export.
 */
function generateConsentHtml(record: ConsentRecord): string {
  const statusColors: Record<string, string> = {
    active: '#3DDC97',
    expired: '#F59E0B',
    revoked: '#EF4444',
    draft: '#9CA3AF',
  };

  const partiesHtml = record.parties
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.role}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.email || 'N/A'}</td>
      </tr>`
    )
    .join('');

  const signaturesHtml = record.signatures
    .map(
      (s) => `
      <div style="margin-bottom: 24px;">
        <p style="font-weight: 600; margin-bottom: 4px;">${s.partyName}</p>
        <img src="${s.signatureImage}" style="max-width: 300px; height: 100px; border: 1px solid #ddd; padding: 4px;" />
        <p style="font-size: 12px; color: #666;">Signed: ${new Date(s.timestamp).toLocaleString()}</p>
      </div>`
    )
    .join('');

  const consentTextHtml = record.consentText
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #1A1A1A;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #1A73E8;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #1A73E8;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #666;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background-color: ${statusColors[record.status] || '#999'};
    }
    .section {
      margin-bottom: 24px;
    }
    .section h2 {
      font-size: 16px;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 8px;
      background: #f5f5f5;
      font-size: 13px;
      color: #666;
    }
    .consent-text {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 4px;
      font-size: 14px;
    }
    .recording-ref {
      background: #FFF3CD;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
    }
    .hash-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #999;
      word-break: break-all;
    }
    .watermark {
      text-align: center;
      font-size: 11px;
      color: #ccc;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${record.title}</h1>
    <div class="meta">
      <span>Template: ${record.templateName}</span>
      <span>Created: ${new Date(record.createdAt).toLocaleDateString()}</span>
      <span class="status-badge">${record.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="section">
    <h2>Parties</h2>
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

  <div class="section">
    <h2>Consent Agreement</h2>
    <div class="consent-text">
      <p>${consentTextHtml}</p>
    </div>
  </div>

  ${
    record.expiresAt
      ? `<div class="section">
      <h2>Validity</h2>
      <p>Effective from ${new Date(record.createdAt).toLocaleDateString()} to ${new Date(record.expiresAt).toLocaleDateString()}</p>
    </div>`
      : ''
  }

  ${
    record.revokedAt
      ? `<div class="section">
      <h2>Revocation</h2>
      <p style="color: #EF4444;">This consent was revoked on ${new Date(record.revokedAt).toLocaleDateString()}</p>
    </div>`
      : ''
  }

  <div class="section">
    <h2>Signatures</h2>
    ${signaturesHtml}
  </div>

  ${
    record.recordingUri
      ? `<div class="section">
      <h2>Audio Recording</h2>
      <div class="recording-ref">
        An audio recording of ${record.recordingDuration ? Math.round(record.recordingDuration) + ' seconds' : 'this consent'} is stored locally on the device and associated with this record.
        <br/>Record ID: ${record.id}
      </div>
    </div>`
      : ''
  }

  <div class="hash-footer">
    <strong>Document Integrity Hash (SHA-256):</strong><br/>
    ${record.documentHash || 'N/A'}
    <br/><br/>
    <strong>Record ID:</strong> ${record.id}<br/>
    <strong>Generated:</strong> ${new Date().toISOString()}
  </div>

  <div class="watermark">
    Generated by cnsnt - Consent Management App
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
      title: record.title,
      consentText: record.consentText,
      parties: record.parties,
      signatures: record.signatures,
      createdAt: record.createdAt,
    });
    return vault.sha256(content);
  }
}

export const exportService = new ExportService();
export default exportService;
