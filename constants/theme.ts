/**
 * Design system constants for cnsnt app.
 * Professional trust-building palette for consent record management.
 * SF Pro Display for hero numbers, SF Pro Text for body (17pt).
 * Minimum 44x44pt touch targets, 60fps animations <400ms.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary palette
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryMuted: '#DBEAFE',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',

  // Neutrals
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#E2E8F0',
  divider: '#E2E8F0',

  // Text
  textPrimary: '#1A202C',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#3B82F6',

  // Consent status
  statusActive: '#10B981',
  statusExpired: '#F59E0B',
  statusRevoked: '#EF4444',
  statusDraft: '#94A3B8',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#94A3B8',

  // Onboarding
  onboardingGradientStart: '#3B82F6',
  onboardingGradientEnd: '#1D4ED8',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export const Typography = {
  // SF Pro Display for hero numbers - NutriAI polish: ultralight weight, tight tracking
  heroNumber: {
    fontSize: 54,
    lineHeight: 62,
    fontWeight: '200' as const,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'] as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  // SF Pro Text for body (17pt)
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  // NutriAI polish: 24-28px section gaps
  section: 28,
  xxl: 32,
  xxxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  round: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // NutriAI card depth: subtle shadow for light theme cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// NutriAI card depth border style for light theme
export const CardBorder = {
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.08)',
} as const;

// Touch target minimum 44x44pt
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH_SIZE = 44;

// Animation durations (<400ms for 60fps feel)
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: { damping: 15, stiffness: 150 },
} as const;

export const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const FREE_TIER_LIMIT = 5;

export const PRO_MONTHLY_PRICE = '$4.99';
export const PRO_YEARLY_PRICE = '$29.99';

// Custom asset references
export const Assets = {
  logoFullColor: require('../assets/logo_fullcolor.png'),
  logoText: require('../assets/logo_text.png'),
  iconShield: require('../assets/icon_shield.png'),
  iconSignature: require('../assets/icon_signature.png'),
  iconChecklist: require('../assets/icon_checklist.png'),
  iconCloudLock: require('../assets/icon_cloud_lock.png'),
  iconPdf: require('../assets/icon_pdf.png'),
  iconVideo: require('../assets/icon_video.png'),
  ghostIcon: require('../assets/ghost_icon.png'),
  spriteKodama: require('../assets/sprite_kodama.png'),
  bgForestWatercolor: require('../assets/bg_forest_watercolor.png'),
  bgPaperTexture: require('../assets/bg_paper_texture.png'),
  patternLeaf: require('../assets/pattern_leaf.png'),
  whimsyBg: require('../assets/whimsy_bg.png'),
  splashShowcase: require('../assets/splash_showcase.png'),
  appIcon: require('../assets/app_icon.png'),
} as const;
