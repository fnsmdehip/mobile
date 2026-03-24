/**
 * Shared TypeScript types for the cnsnt app.
 */

export type ConsentStatus = 'active' | 'expired' | 'revoked' | 'draft';

export interface ConsentRecord {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  status: ConsentStatus;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  parties: PartyInfo[];
  consentText: string;
  signatures: SignatureData[];
  recordingUri: string | null;
  recordingDuration: number | null;
  pdfUri: string | null;
  documentHash: string | null;
  metadata: Record<string, string>;
}

export interface PartyInfo {
  name: string;
  role: string;
  email?: string;
}

export interface SignatureData {
  partyName: string;
  signatureImage: string;
  timestamp: string;
}

export interface ConsentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  fields: TemplateField[];
  consentText: string;
  requiresDualSignature: boolean;
  defaultExpiryDays: number | null;
  isPremium: boolean;
  icon: string;
}

export type TemplateCategory =
  | 'medical'
  | 'legal'
  | 'business'
  | 'media'
  | 'research'
  | 'property'
  | 'personal'
  | 'custom';

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'date' | 'multiline' | 'email' | 'number';
  required: boolean;
}

export interface UserSettings {
  biometricEnabled: boolean;
  autoLockTimeoutMinutes: number;
  pinHash: string | null;
}

export type Entitlement = 'free' | 'pro';

export interface PurchaseState {
  entitlement: Entitlement;
  recordCount: number;
  canCreateRecord: boolean;
  canRecord: boolean;
  canUseTemplates: boolean;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Lock: undefined;
  Main: undefined;
  Home: undefined;
  Dashboard: undefined;
  ConsentBuilder: { title: string; templateId?: string };
  Recording: { consentId?: string };
  NDA: undefined;
  SexualConsent: undefined;
  Waiver: undefined;
  MutualRelease: undefined;
  Settings: undefined;
  TemplateForm: { templateId: string };
  TemplateEditor: { templateId?: string };
  ConsentDetail: { consentId: string };
  PDFPreview: { recordId: string };
};

export interface DashboardStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  draft: number;
  expiringSoon: number;
  recentlyCreated: number;
}
