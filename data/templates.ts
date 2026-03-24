/**
 * Pre-built consent templates for cnsnt app.
 *
 * Categories: medical, legal, business, media, research, property, personal
 * Each template has field definitions and markdown consent text with placeholders.
 */

import type { ConsentTemplate } from '../types';

export const BUILT_IN_TEMPLATES: ConsentTemplate[] = [
  // ─── MEDICAL ────────────────────────────────────────────
  {
    id: 'tpl_medical_consent',
    name: 'Medical Procedure Consent',
    category: 'medical',
    description: 'Standard informed consent for medical procedures, treatments, or examinations.',
    icon: '\u{1F3E5}',
    isPremium: false,
    requiresDualSignature: false,
    defaultExpiryDays: null,
    fields: [
      { key: 'patientName', label: 'Patient Name', placeholder: 'Full legal name', type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
      { key: 'providerName', label: 'Provider / Physician', placeholder: 'Dr. Name', type: 'text', required: true },
      { key: 'facilityName', label: 'Facility / Clinic', placeholder: 'Hospital or clinic name', type: 'text', required: true },
      { key: 'procedureName', label: 'Procedure / Treatment', placeholder: 'Name of procedure', type: 'text', required: true },
      { key: 'procedureDescription', label: 'Description of Procedure', placeholder: 'Brief description', type: 'multiline', required: true },
      { key: 'risks', label: 'Known Risks', placeholder: 'List known risks and side effects', type: 'multiline', required: true },
      { key: 'alternatives', label: 'Alternatives', placeholder: 'Alternative treatments available', type: 'multiline', required: false },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Medical Procedure Consent Form

**Patient:** {{patientName}}
**Date of Birth:** {{dateOfBirth}}
**Provider:** {{providerName}}
**Facility:** {{facilityName}}
**Date:** {{date}}

## Procedure / Treatment
{{procedureName}}

{{procedureDescription}}

## Informed Consent

I, {{patientName}}, hereby consent to the above-described procedure/treatment to be performed by {{providerName}} at {{facilityName}}.

### Risks and Complications
I understand that the following risks and complications may occur:

{{risks}}

### Alternatives
I have been informed of the following alternatives to this procedure:

{{alternatives}}

### Acknowledgments
- I have been given the opportunity to ask questions about my condition, the proposed procedure, risks, and alternatives.
- I understand that no guarantees have been made to me about the results of the procedure.
- I understand I have the right to withdraw this consent at any time before the procedure.
- I consent to the administration of anesthesia as deemed necessary.
- I understand that unforeseen conditions may require additional or different procedures.

### Authorization
I have read and understand this consent form. I voluntarily give my consent for the procedure described above.`,
  },

  // ─── PHOTO / VIDEO RELEASE ──────────────────────────────
  {
    id: 'tpl_photo_video_release',
    name: 'Photo / Video Release',
    category: 'media',
    description: 'Authorization to use photos, videos, or other media of an individual.',
    icon: '\u{1F4F7}',
    isPremium: false,
    requiresDualSignature: true,
    defaultExpiryDays: 365,
    fields: [
      { key: 'subjectName', label: 'Subject Name', placeholder: 'Person being photographed/recorded', type: 'text', required: true },
      { key: 'organizationName', label: 'Organization / Company', placeholder: 'Company or individual using the media', type: 'text', required: true },
      { key: 'eventDescription', label: 'Event / Context', placeholder: 'Where and why the media is being captured', type: 'multiline', required: true },
      { key: 'usageDescription', label: 'Intended Use', placeholder: 'How the media will be used (marketing, social, etc.)', type: 'multiline', required: true },
      { key: 'compensation', label: 'Compensation', placeholder: 'None, or describe compensation', type: 'text', required: false },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Photo / Video Release Authorization

**Date:** {{date}}

## Parties
- **Subject:** {{subjectName}}
- **Organization:** {{organizationName}}

## Release and Authorization

I, {{subjectName}}, hereby grant {{organizationName}} and its agents, successors, and assigns the irrevocable right to use my image, likeness, voice, and/or appearance as captured in photographs, video recordings, or other media formats.

### Context
{{eventDescription}}

### Permitted Uses
{{usageDescription}}

This authorization includes, but is not limited to:
- Publication in print and digital media
- Use on websites and social media platforms
- Marketing and promotional materials
- Internal communications and training materials

### Compensation
{{compensation}}

### Terms
- I waive any right to inspect or approve the finished product.
- I release {{organizationName}} from any claims arising from the use of my image/likeness.
- I understand this release is binding on my heirs and assigns.
- I am of legal age and have the right to enter into this agreement.`,
  },

  // ─── NDA ────────────────────────────────────────────────
  {
    id: 'tpl_nda',
    name: 'Non-Disclosure Agreement',
    category: 'business',
    description: 'Standard mutual or one-way NDA for protecting confidential information.',
    icon: '\u{1F512}',
    isPremium: true,
    requiresDualSignature: true,
    defaultExpiryDays: 730,
    fields: [
      { key: 'disclosingParty', label: 'Disclosing Party', placeholder: 'Name of party sharing information', type: 'text', required: true },
      { key: 'receivingParty', label: 'Receiving Party', placeholder: 'Name of party receiving information', type: 'text', required: true },
      { key: 'scope', label: 'Scope of Confidential Information', placeholder: 'Describe what is confidential', type: 'multiline', required: true },
      { key: 'term', label: 'Term (years)', placeholder: 'e.g., 2', type: 'number', required: true },
      { key: 'governingLaw', label: 'Governing Law', placeholder: 'State / jurisdiction', type: 'text', required: true },
      { key: 'date', label: 'Effective Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Non-Disclosure Agreement

**Effective Date:** {{date}}

## Parties
- **Disclosing Party:** {{disclosingParty}}
- **Receiving Party:** {{receivingParty}}

## 1. Definition of Confidential Information
"Confidential Information" includes all information disclosed by the Disclosing Party to the Receiving Party, including but not limited to:

{{scope}}

## 2. Obligations of Receiving Party
The Receiving Party agrees to:
- Hold all Confidential Information in strict confidence
- Not disclose Confidential Information to any third party without prior written consent
- Use Confidential Information only for the agreed-upon purpose
- Protect Confidential Information with at least the same degree of care used for its own confidential information

## 3. Exclusions
This agreement does not apply to information that:
- Is or becomes publicly known through no fault of the Receiving Party
- Was known to the Receiving Party before disclosure
- Is independently developed without use of Confidential Information
- Is disclosed with written approval of the Disclosing Party

## 4. Term
This agreement shall remain in effect for {{term}} year(s) from the Effective Date.

## 5. Return of Information
Upon termination or request, the Receiving Party shall return or destroy all Confidential Information.

## 6. Governing Law
This agreement shall be governed by the laws of {{governingLaw}}.

## 7. Remedies
The Disclosing Party shall be entitled to seek injunctive relief for any breach of this agreement.`,
  },

  // ─── GDPR DATA PROCESSING ──────────────────────────────
  {
    id: 'tpl_gdpr_consent',
    name: 'GDPR Data Processing Consent',
    category: 'legal',
    description: 'GDPR-compliant consent for processing personal data within the EU/EEA.',
    icon: '\u{1F6E1}',
    isPremium: true,
    requiresDualSignature: false,
    defaultExpiryDays: 365,
    fields: [
      { key: 'dataSubjectName', label: 'Data Subject Name', placeholder: 'Your full name', type: 'text', required: true },
      { key: 'dataSubjectEmail', label: 'Data Subject Email', placeholder: 'Your email address', type: 'email', required: true },
      { key: 'controllerName', label: 'Data Controller', placeholder: 'Organization collecting data', type: 'text', required: true },
      { key: 'controllerAddress', label: 'Controller Address', placeholder: 'Registered address', type: 'text', required: true },
      { key: 'dataTypes', label: 'Types of Data Collected', placeholder: 'Name, email, usage data, etc.', type: 'multiline', required: true },
      { key: 'purposes', label: 'Processing Purposes', placeholder: 'Why data is being collected and processed', type: 'multiline', required: true },
      { key: 'retentionPeriod', label: 'Data Retention Period', placeholder: 'e.g., 2 years', type: 'text', required: true },
      { key: 'dpoContact', label: 'DPO Contact', placeholder: 'Data Protection Officer email', type: 'email', required: false },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# GDPR Data Processing Consent

**Date:** {{date}}

## Data Controller
**{{controllerName}}**
{{controllerAddress}}
DPO Contact: {{dpoContact}}

## Data Subject
**{{dataSubjectName}}**
{{dataSubjectEmail}}

## Consent Declaration

I, {{dataSubjectName}}, hereby provide my explicit consent for {{controllerName}} to collect and process my personal data as described below, in accordance with the General Data Protection Regulation (EU) 2016/679.

### Types of Personal Data
{{dataTypes}}

### Purposes of Processing
{{purposes}}

### Data Retention
Personal data will be retained for: {{retentionPeriod}}

### Your Rights
Under GDPR, you have the right to:
- **Access** your personal data
- **Rectify** inaccurate personal data
- **Erase** your personal data ("right to be forgotten")
- **Restrict** processing of your personal data
- **Data portability** - receive your data in a structured format
- **Object** to processing of your personal data
- **Withdraw consent** at any time without affecting the lawfulness of prior processing

### How to Exercise Your Rights
Contact the Data Protection Officer at {{dpoContact}} or write to {{controllerAddress}}.

### Consent
By signing below, I confirm that:
- I have read and understood this consent form
- I voluntarily provide my consent for the described data processing
- I understand I may withdraw my consent at any time`,
  },

  // ─── RESEARCH PARTICIPATION ─────────────────────────────
  {
    id: 'tpl_research_participation',
    name: 'Research Participation Consent',
    category: 'research',
    description: 'Informed consent for participation in research studies or clinical trials.',
    icon: '\u{1F52C}',
    isPremium: true,
    requiresDualSignature: true,
    defaultExpiryDays: null,
    fields: [
      { key: 'participantName', label: 'Participant Name', placeholder: 'Full legal name', type: 'text', required: true },
      { key: 'researcherName', label: 'Principal Investigator', placeholder: 'Lead researcher name', type: 'text', required: true },
      { key: 'institution', label: 'Institution', placeholder: 'University or research organization', type: 'text', required: true },
      { key: 'studyTitle', label: 'Study Title', placeholder: 'Title of the research study', type: 'text', required: true },
      { key: 'studyPurpose', label: 'Purpose of Study', placeholder: 'Why this research is being conducted', type: 'multiline', required: true },
      { key: 'procedures', label: 'Procedures', placeholder: 'What will happen during participation', type: 'multiline', required: true },
      { key: 'risks', label: 'Risks', placeholder: 'Known risks of participation', type: 'multiline', required: true },
      { key: 'benefits', label: 'Benefits', placeholder: 'Potential benefits', type: 'multiline', required: false },
      { key: 'compensation', label: 'Compensation', placeholder: 'Payment or compensation details', type: 'text', required: false },
      { key: 'irbApproval', label: 'IRB Approval Number', placeholder: 'IRB protocol number', type: 'text', required: false },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Research Participation Informed Consent

**Study Title:** {{studyTitle}}
**Principal Investigator:** {{researcherName}}
**Institution:** {{institution}}
**IRB Approval:** {{irbApproval}}
**Date:** {{date}}

## Purpose
{{studyPurpose}}

## Procedures
If you agree to participate, the following will occur:

{{procedures}}

## Risks and Discomforts
{{risks}}

## Benefits
{{benefits}}

## Compensation
{{compensation}}

## Confidentiality
All data collected will be kept confidential and stored securely. Your identity will not be revealed in any publications or presentations.

## Voluntary Participation
- Your participation is entirely voluntary
- You may withdraw at any time without penalty
- Refusal to participate will not affect your relationship with {{institution}}
- You may skip any questions or procedures you do not wish to complete

## Contact Information
For questions about this study, contact {{researcherName}} at {{institution}}.

## Consent Statement
I, {{participantName}}, have read and understand this consent form. I have had the opportunity to ask questions, and my questions have been answered satisfactorily. I voluntarily agree to participate in this research study.`,
  },

  // ─── PROPERTY ENTRY ─────────────────────────────────────
  {
    id: 'tpl_property_entry',
    name: 'Property Entry Authorization',
    category: 'property',
    description: 'Authorization for entry onto private property, with liability acknowledgment.',
    icon: '\u{1F3E0}',
    isPremium: true,
    requiresDualSignature: true,
    defaultExpiryDays: 30,
    fields: [
      { key: 'visitorName', label: 'Visitor Name', placeholder: 'Person entering property', type: 'text', required: true },
      { key: 'ownerName', label: 'Property Owner', placeholder: 'Owner or authorized representative', type: 'text', required: true },
      { key: 'propertyAddress', label: 'Property Address', placeholder: 'Full address of the property', type: 'multiline', required: true },
      { key: 'purpose', label: 'Purpose of Entry', placeholder: 'Reason for entering the property', type: 'multiline', required: true },
      { key: 'entryDate', label: 'Entry Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
      { key: 'exitDate', label: 'Expected Exit Date', placeholder: 'YYYY-MM-DD', type: 'date', required: false },
      { key: 'restrictions', label: 'Restrictions / Conditions', placeholder: 'Any areas or activities that are off-limits', type: 'multiline', required: false },
      { key: 'date', label: 'Agreement Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Property Entry Authorization

**Date:** {{date}}

## Property
{{propertyAddress}}

## Parties
- **Property Owner:** {{ownerName}}
- **Visitor:** {{visitorName}}

## Authorization
{{ownerName}} hereby authorizes {{visitorName}} to enter the above-described property for the following purpose:

{{purpose}}

### Period of Access
- **Entry Date:** {{entryDate}}
- **Expected Exit Date:** {{exitDate}}

### Restrictions
{{restrictions}}

## Liability Acknowledgment
{{visitorName}} acknowledges and agrees that:
- Entry is at their own risk
- They will comply with all stated restrictions and conditions
- They will not damage property or disturb occupants
- They will leave the property in its original condition
- They assume responsibility for any injury sustained during the visit
- They will not hold {{ownerName}} liable for accidents or injuries

## Revocation
This authorization may be revoked at any time by either party with immediate effect.`,
  },

  // ─── LIABILITY WAIVER ───────────────────────────────────
  {
    id: 'tpl_liability_waiver',
    name: 'Liability Waiver',
    category: 'legal',
    description: 'General liability waiver and assumption of risk for activities or events.',
    icon: '\u{26A0}',
    isPremium: false,
    requiresDualSignature: false,
    defaultExpiryDays: null,
    fields: [
      { key: 'participantName', label: 'Participant Name', placeholder: 'Full legal name', type: 'text', required: true },
      { key: 'organizationName', label: 'Organization', placeholder: 'Company or event organizer', type: 'text', required: true },
      { key: 'activityDescription', label: 'Activity Description', placeholder: 'Describe the activity or event', type: 'multiline', required: true },
      { key: 'location', label: 'Location', placeholder: 'Where the activity takes place', type: 'text', required: true },
      { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Name and phone number', type: 'text', required: true },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Liability Waiver and Release

**Date:** {{date}}

## Parties
- **Participant:** {{participantName}}
- **Organization:** {{organizationName}}
- **Location:** {{location}}

## Activity
{{activityDescription}}

## Assumption of Risk
I, {{participantName}}, acknowledge that participation in the above activity involves inherent risks, including but not limited to physical injury, property damage, or other hazards.

I voluntarily assume all risks associated with this activity.

## Release and Waiver
I release, waive, and discharge {{organizationName}}, its officers, employees, agents, and volunteers from any and all liability for injury, illness, death, or property damage arising from my participation.

## Indemnification
I agree to indemnify and hold harmless {{organizationName}} from any claims, damages, or expenses arising from my participation.

## Medical Authorization
In case of emergency, I authorize {{organizationName}} to obtain medical treatment on my behalf.

**Emergency Contact:** {{emergencyContact}}

## Acknowledgments
- I have read this waiver and understand its contents
- I am of legal age and competent to sign this document
- I sign this waiver voluntarily
- This waiver is binding on my heirs and assigns`,
  },

  // ─── MUTUAL RELEASE ─────────────────────────────────────
  {
    id: 'tpl_mutual_release',
    name: 'Mutual Release of Claims',
    category: 'legal',
    description: 'Both parties mutually release each other from all claims and obligations.',
    icon: '\u{1F91D}',
    isPremium: true,
    requiresDualSignature: true,
    defaultExpiryDays: null,
    fields: [
      { key: 'partyA', label: 'Party A', placeholder: 'First party name', type: 'text', required: true },
      { key: 'partyB', label: 'Party B', placeholder: 'Second party name', type: 'text', required: true },
      { key: 'disputeDescription', label: 'Description of Dispute / Matter', placeholder: 'What this release covers', type: 'multiline', required: true },
      { key: 'consideration', label: 'Consideration', placeholder: 'What each party receives (if any)', type: 'multiline', required: false },
      { key: 'governingLaw', label: 'Governing Law', placeholder: 'State / jurisdiction', type: 'text', required: true },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Mutual Release of Claims

**Date:** {{date}}

## Parties
- **Party A:** {{partyA}}
- **Party B:** {{partyB}}

## Background
This Mutual Release relates to the following matter:

{{disputeDescription}}

## Mutual Release
Each party hereby releases and discharges the other from any and all claims, demands, obligations, liabilities, and causes of action arising from or related to the above matter.

## Consideration
{{consideration}}

## Terms
- This release is final and binding on both parties
- Neither party admits fault or liability
- Both parties waive any future claims related to this matter
- This release is binding on heirs, successors, and assigns

## Representations
Each party represents that:
- They have the authority to enter into this release
- They have not assigned any claims to third parties
- They have received adequate legal counsel (or have voluntarily waived this right)

## Governing Law
This release shall be governed by the laws of {{governingLaw}}.`,
  },

  // ─── PERSONAL CONSENT ──────────────────────────────────
  {
    id: 'tpl_personal_consent',
    name: 'General Personal Consent',
    category: 'personal',
    description: 'A flexible consent form for personal agreements, permissions, or acknowledgments.',
    icon: '\u{1F4DD}',
    isPremium: false,
    requiresDualSignature: true,
    defaultExpiryDays: 90,
    fields: [
      { key: 'consentGiver', label: 'Person Giving Consent', placeholder: 'Full legal name', type: 'text', required: true },
      { key: 'consentReceiver', label: 'Person Receiving Consent', placeholder: 'Full legal name', type: 'text', required: true },
      { key: 'subject', label: 'Subject of Consent', placeholder: 'What is being consented to', type: 'text', required: true },
      { key: 'details', label: 'Details & Conditions', placeholder: 'Describe the terms and conditions in detail', type: 'multiline', required: true },
      { key: 'limitations', label: 'Limitations', placeholder: 'Any restrictions or boundaries', type: 'multiline', required: false },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date', required: true },
    ],
    consentText: `# Personal Consent Agreement

**Date:** {{date}}

## Parties
- **Consent Giver:** {{consentGiver}}
- **Consent Receiver:** {{consentReceiver}}

## Subject
{{subject}}

## Terms & Conditions
I, {{consentGiver}}, hereby provide my informed and voluntary consent to {{consentReceiver}} regarding the following:

{{details}}

## Limitations
{{limitations}}

## Acknowledgments
- This consent is given freely and voluntarily
- I understand the nature and implications of this consent
- I may withdraw this consent at any time by providing written notice
- This agreement is valid for 90 days from the date of signing unless renewed
- Both parties agree to act in good faith

## Signatures
By signing below, both parties acknowledge and agree to the terms stated above.`,
  },
];

/**
 * Get all templates including any saved custom templates.
 */
export function getAllTemplates(): ConsentTemplate[] {
  return [...BUILT_IN_TEMPLATES];
}

/**
 * Get a template by ID.
 */
export function getTemplateById(id: string): ConsentTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(category: string): ConsentTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get free templates only.
 */
export function getFreeTemplates(): ConsentTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium);
}

/**
 * Fill template text with field values.
 */
export function fillTemplate(
  template: ConsentTemplate,
  values: Record<string, string>
): string {
  let text = template.consentText;
  for (const [key, value] of Object.entries(values)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return text;
}

export default BUILT_IN_TEMPLATES;
