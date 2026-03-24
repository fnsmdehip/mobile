# cnsnt - Secure Consent Management App

React Native Expo app for creating, signing, recording, and managing legally-relevant consent records. Built for lawyers, HR professionals, medical practitioners, and anyone who needs verifiable consent documentation.

## Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

### Custom Dev Client (for full features)

Some features require a custom dev client build (biometrics on real devices, RevenueCat purchases):

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Architecture

```
mobile/
  App.tsx                  # Root: auth gate, navigation, auto-lock
  constants/
    theme.ts               # Colors, typography, spacing, shadows
  types/
    index.ts               # TypeScript types for records, templates, navigation
  services/
    encryption.ts          # AES-256 vault, key derivation, integrity hashing
    auth.ts                # Biometric (Face ID / fingerprint) + PIN auth
    database.ts            # Encrypted CRUD for consent records
    export.ts              # PDF generation and sharing
    purchases.ts           # RevenueCat integration, entitlement gating
  data/
    templates.ts           # 8 pre-built consent templates
  hooks/
    useAppState.ts         # Background/foreground auto-lock
    usePurchases.ts        # Entitlement state hook
  components/
    ErrorBoundary.tsx      # Catches render errors gracefully
    PaywallGate.tsx        # Wraps premium features with upgrade modal
    StatusBadge.tsx        # Active/expired/revoked/draft badges
    DualSignature.tsx      # Two-party signature capture
  screens/
    LockScreen.tsx         # Biometric + PIN authentication
    HomeScreen.tsx         # Templates hub with quick actions
    Dashboard.tsx          # Record list with stats, search, filters
    Settings.tsx           # Security, subscription, data management
    RecordingScreen.tsx    # Audio recording with waveform visualization
    TemplateForm.tsx       # Template-driven consent form builder
    ConsentBuilderScreen.tsx  # Legacy checklist builder
    NdaScreen.tsx          # Legacy NDA form
    WaiverScreen.tsx       # Legacy waiver form
    MutualReleaseScreen.tsx   # Legacy mutual release form
    SexualConsentScreen.tsx   # Legacy sexual consent form
```

## Features

### Security
- **Encryption Vault**: All consent records encrypted with key derived from user authentication
- **Biometric Auth**: Face ID / fingerprint via expo-local-authentication
- **PIN Fallback**: 4-8 digit PIN for devices without biometrics
- **Auto-Lock**: Configurable timeout (1-30 minutes), locks on background
- **Integrity Hashing**: SHA-256 document hash for tamper detection

### Consent Templates
8 pre-built templates covering common consent scenarios:
- Medical Procedure Consent
- Photo/Video Release
- Non-Disclosure Agreement (NDA)
- GDPR Data Processing Consent
- Research Participation Consent
- Property Entry Authorization
- Liability Waiver
- Mutual Release of Claims

Each template includes field definitions, markdown consent text with placeholders, dual-signature support, and configurable expiry periods.

### Recording
- Audio recording via expo-av
- Real-time duration display
- Waveform visualization
- Playback controls
- Share/export recordings
- Transcription placeholder (marked as premium/future feature)

### Dashboard
- All records listed with status badges (active, expired, revoked, draft)
- Search by title, template, or party name
- Filter by status
- Quick stats: total, active, expiring soon, recently created
- Pull-to-refresh
- Export individual records as PDF
- Revoke active consent records

### Export
- Professional PDF export with all consent details
- Includes: consent text, party info, signatures, timestamps
- SHA-256 document integrity hash in footer
- Recording reference when applicable
- Share via email, AirDrop, or any system share target

### Monetization (RevenueCat)
- **Free tier**: 5 consent records, basic templates, no recording
- **Pro ($4.99/mo)**: Unlimited records, all templates, audio recording
- Paywall gates on premium features
- Restore purchases support
- Graceful degradation when SDK unavailable

## Tech Stack

- **Framework**: React Native + Expo SDK 52
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (bottom tabs + native stack)
- **Encryption**: expo-crypto (SHA-256 key derivation + XOR stream cipher)
- **Auth**: expo-local-authentication + expo-secure-store
- **Storage**: AsyncStorage (encrypted via vault) + SecureStore (keys)
- **PDF**: expo-print (HTML-to-PDF)
- **Audio**: expo-av
- **Signatures**: react-native-signature-canvas
- **Purchases**: RevenueCat (integration point, requires custom dev client)

## New Dependencies to Install

```bash
npm install expo-crypto expo-local-authentication @react-navigation/bottom-tabs
```
