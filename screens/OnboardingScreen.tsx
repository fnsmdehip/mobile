/**
 * Onboarding Flow - 6 steps:
 * 1. Welcome - "Secure digital consent management"
 * 2. Biometric setup (Face ID / Touch ID enrollment)
 * 3. PIN backup setup
 * 4. Template demo (show the 8 consent types)
 * 5. Value moment - SHA-256 hash verification (the magic)
 * 6. Paywall - Free vs Pro (annual $29.99/yr pre-selected)
 *
 * Uses custom image assets, watercolor backgrounds, animated transitions.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ImageBackground,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/auth';
import {
  Colors, Typography, Spacing, BorderRadius, Shadows,
  MIN_TOUCH_SIZE, PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE, Assets,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 6;

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [biometricName, setBiometricName] = useState('Face ID');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSet, setPinSet] = useState(false);
  const [biometricSet, setBiometricSet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    (async () => {
      const support = await authService.checkBiometricSupport();
      setHasBiometrics(support.available);
      if (support.available) {
        const name = await authService.getBiometricTypeName();
        setBiometricName(name);
      }
    })();
  }, []);

  const animateTransition = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    } else {
      onComplete();
    }
  }, [step, animateTransition, onComplete]);

  const handleSkip = useCallback(() => {
    if (step < 3) {
      animateTransition(step + 1);
    } else {
      onComplete();
    }
  }, [step, animateTransition, onComplete]);

  const handleBiometricSetup = async () => {
    try {
      await authService.setBiometricEnabled(true);
      const success = await authService.authenticateWithBiometrics();
      if (success) {
        setBiometricSet(true);
        setTimeout(() => handleNext(), 500);
      }
    } catch (_e) {
      Alert.alert('Setup Failed', 'Biometric setup failed. You can enable it later in Settings.');
      handleNext();
    }
  };

  const handlePinSetup = async () => {
    setPinError('');
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== pinConfirm) {
      setPinError('PINs do not match');
      return;
    }
    try {
      await authService.setPin(pin);
      setPinSet(true);
      setTimeout(() => handleNext(), 500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to set PIN';
      setPinError(msg);
    }
  };

  const renderProgressDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );

  // Step 0: Welcome
  const renderWelcome = () => (
    <ImageBackground
      source={Assets.bgForestWatercolor}
      style={styles.bgImageContainer}
      imageStyle={styles.bgImage}
    >
      <View style={styles.stepContent}>
        <View style={styles.heroImageContainer}>
          <Image
            source={Assets.iconShield}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.heroTitle}>Secure digital{'\n'}consent management</Text>
        <Text style={styles.heroSubtitle}>
          Professional consent records with encryption, digital signatures, and tamper-proof verification.
        </Text>
        <View style={styles.featureGrid}>
          {[
            { asset: Assets.iconCloudLock, label: 'AES-256 Encryption' },
            { asset: Assets.iconChecklist, label: '8 Record Templates' },
            { asset: Assets.iconSignature, label: 'Dual Signatures' },
            { asset: Assets.iconPdf, label: 'PDF Export + Hash' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Image source={f.asset} style={styles.featureIcon} resizeMode="contain" />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ImageBackground>
  );

  // Step 1: Biometric
  const renderBiometric = () => (
    <View style={styles.stepContent}>
      <View style={styles.heroImageContainer}>
        <Image
          source={Assets.iconShield}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stepTitle}>Secure with {biometricName}</Text>
      <Text style={styles.stepSubtitle}>
        {hasBiometrics
          ? `Use ${biometricName} to quickly and securely unlock your consent vault.`
          : 'Your device does not support biometric authentication. You can set up a PIN instead.'}
      </Text>
      {biometricSet && (
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>{'\u2713'} {biometricName} Enabled</Text>
        </View>
      )}
      {hasBiometrics && !biometricSet && (
        <Pressable style={styles.setupButton} onPress={handleBiometricSetup}>
          <Text style={styles.setupButtonText}>Enable {biometricName}</Text>
        </Pressable>
      )}
      {!hasBiometrics && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardText}>
            No biometrics detected. Skip to set up PIN backup.
          </Text>
        </View>
      )}
    </View>
  );

  // Step 2: PIN
  const renderPinSetup = () => (
    <View style={styles.stepContent}>
      <View style={styles.heroImageContainer}>
        <Image
          source={Assets.iconCloudLock}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stepTitle}>Create a Backup PIN</Text>
      <Text style={styles.stepSubtitle}>
        Your PIN provides a fallback way to access your encrypted consent vault.
      </Text>
      {pinSet ? (
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>{'\u2713'} PIN Created</Text>
        </View>
      ) : (
        <View style={styles.pinContainer}>
          <TextInput
            style={styles.pinInput}
            secureTextEntry
            keyboardType="numeric"
            maxLength={8}
            placeholder="Enter PIN (4-8 digits)"
            placeholderTextColor={Colors.textTertiary}
            value={pin}
            onChangeText={setPin}
          />
          <TextInput
            style={styles.pinInput}
            secureTextEntry
            keyboardType="numeric"
            maxLength={8}
            placeholder="Confirm PIN"
            placeholderTextColor={Colors.textTertiary}
            value={pinConfirm}
            onChangeText={setPinConfirm}
          />
          {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
          <Pressable style={styles.setupButton} onPress={handlePinSetup}>
            <Text style={styles.setupButtonText}>Set PIN</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  // Step 3: Template Demo (show the 8 consent types)
  const renderTemplateDemo = () => (
    <View style={styles.stepContent}>
      <View style={styles.heroImageContainer}>
        <Image
          source={Assets.iconChecklist}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stepTitle}>Professional Templates</Text>
      <Text style={styles.stepSubtitle}>
        Choose from 8 pre-built consent record templates for any situation.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateCarousel}
      >
        {[
          { icon: '\u{1F3E5}', name: 'Medical', desc: 'Informed consent' },
          { icon: '\u{1F4F7}', name: 'Photo/Video', desc: 'Media release' },
          { icon: '\u{1F512}', name: 'NDA', desc: 'Confidentiality' },
          { icon: '\u{1F6E1}', name: 'GDPR', desc: 'Data processing' },
          { icon: '\u{1F52C}', name: 'Research', desc: 'Study consent' },
          { icon: '\u{1F3E0}', name: 'Property', desc: 'Entry auth' },
          { icon: '\u{26A0}', name: 'Liability', desc: 'Waiver' },
          { icon: '\u{1F91D}', name: 'Mutual', desc: 'Both parties' },
        ].map((t, i) => (
          <View key={i} style={styles.demoTemplateCard}>
            <Text style={styles.demoTemplateIcon}>{t.icon}</Text>
            <Text style={styles.demoTemplateName}>{t.name}</Text>
            <Text style={styles.demoTemplateDesc}>{t.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Step 4: Value Moment - SHA-256 hash verification
  const renderValueMoment = () => (
    <View style={styles.stepContent}>
      <View style={styles.heroImageContainer}>
        <Image
          source={Assets.iconPdf}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stepTitle}>Tamper-Proof Verification</Text>
      <Text style={styles.stepSubtitle}>
        Every consent record includes a SHA-256 cryptographic hash. If anyone modifies the document, the hash will not match.
      </Text>
      <View style={styles.hashDemo}>
        <View style={styles.hashDemoHeader}>
          <Text style={styles.hashDemoTitle}>Document Integrity</Text>
          <View style={styles.hashVerifiedBadge}>
            <Text style={styles.hashVerifiedText}>{'\u2713'} Verified</Text>
          </View>
        </View>
        <Text style={styles.hashDemoLabel}>SHA-256 Hash</Text>
        <Text style={styles.hashDemoValue}>
          a7f3b9c2e1d4f6a8b0c2d4e6f8a1b3c5{'\n'}e7d9f1b2a4c6e8d0f2a4b6c8e0d2f4a6
        </Text>
        <View style={styles.hashDemoDivider} />
        <View style={styles.hashDemoRow}>
          <Text style={styles.hashDemoRowLabel}>Signatures</Text>
          <Text style={styles.hashDemoRowValue}>{'\u2713'} 2 verified</Text>
        </View>
        <View style={styles.hashDemoRow}>
          <Text style={styles.hashDemoRowLabel}>Timestamp</Text>
          <Text style={styles.hashDemoRowValue}>Immutable</Text>
        </View>
        <View style={styles.hashDemoRow}>
          <Text style={styles.hashDemoRowLabel}>Encryption</Text>
          <Text style={styles.hashDemoRowValue}>AES-256</Text>
        </View>
      </View>
    </View>
  );

  // Step 5: Paywall - Annual pre-selected, trust emphasis
  const renderPaywall = () => (
    <View style={styles.stepContent}>
      <Text style={styles.paywallTitle}>Choose Your Plan</Text>
      <Text style={styles.paywallSubtitle}>
        Start free. Upgrade when you need more.
      </Text>

      {/* Annual Plan - Pre-selected */}
      <Pressable
        style={[
          styles.planCard,
          selectedPlan === 'yearly' && styles.planCardSelected,
        ]}
        onPress={() => setSelectedPlan('yearly')}
      >
        <View style={styles.saveBanner}>
          <Text style={styles.saveBannerText}>SAVE 50%</Text>
        </View>
        <View style={styles.planRow}>
          <View style={[
            styles.radioOuter,
            selectedPlan === 'yearly' && styles.radioOuterActive,
          ]}>
            {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>Annual</Text>
            <Text style={styles.planPriceMain}>{PRO_YEARLY_PRICE}<Text style={styles.planPricePeriod}>/year</Text></Text>
            <Text style={styles.planPriceBreakdown}>Just $2.50/month</Text>
          </View>
        </View>
      </Pressable>

      {/* Monthly Plan */}
      <Pressable
        style={[
          styles.planCard,
          selectedPlan === 'monthly' && styles.planCardSelected,
        ]}
        onPress={() => setSelectedPlan('monthly')}
      >
        <View style={styles.planRow}>
          <View style={[
            styles.radioOuter,
            selectedPlan === 'monthly' && styles.radioOuterActive,
          ]}>
            {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPriceMain}>{PRO_MONTHLY_PRICE}<Text style={styles.planPricePeriod}>/month</Text></Text>
          </View>
        </View>
      </Pressable>

      {/* Pro features */}
      <View style={styles.proFeaturesCard}>
        <Text style={styles.proFeaturesTitle}>Pro includes</Text>
        {[
          'Unlimited consent records',
          'All 8 premium templates',
          'PDF export with SHA-256 hash',
          'Audio recording',
          'Cloud backup',
        ].map((f, i) => (
          <Text key={i} style={styles.proFeature}>{'\u2713'}  {f}</Text>
        ))}
      </View>

      {/* Trust badges */}
      <View style={styles.trustBadges}>
        <View style={styles.trustBadge}>
          <Image source={Assets.iconCloudLock} style={styles.trustBadgeIcon} resizeMode="contain" />
          <Text style={styles.trustBadgeText}>Encrypted</Text>
        </View>
        <View style={styles.trustBadge}>
          <Image source={Assets.iconShield} style={styles.trustBadgeIcon} resizeMode="contain" />
          <Text style={styles.trustBadgeText}>On-Device</Text>
        </View>
      </View>

      {/* Free plan info */}
      <View style={styles.freePlanInfo}>
        <Text style={styles.freePlanText}>
          Free: 5 records, basic templates, biometric lock
        </Text>
      </View>
    </View>
  );

  const steps = [
    renderWelcome,
    renderBiometric,
    renderPinSetup,
    renderTemplateDemo,
    renderValueMoment,
    renderPaywall,
  ];

  const getNextLabel = () => {
    switch (step) {
      case 0: return 'Get Started';
      case 1: return biometricSet ? 'Continue' : (hasBiometrics ? 'Skip for Now' : 'Continue');
      case 2: return pinSet ? 'Continue' : 'Skip';
      case 5: return 'Start Free';
      default: return 'Continue';
    }
  };

  const canProceed = () => {
    if (step === 2 && !hasBiometrics && !pinSet) return false;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressDots()}

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {steps[step]()}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>{getNextLabel()}</Text>
        </Pressable>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip All</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.primaryMuted,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  bgImageContainer: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.08,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  heroImageContainer: {
    marginBottom: Spacing.xl,
  },
  heroImage: {
    width: 100,
    height: 100,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xxl,
    maxWidth: 320,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    maxWidth: 320,
  },
  featureItem: {
    width: 140,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  featureIcon: {
    width: 36,
    height: 36,
    marginBottom: Spacing.sm,
  },
  featureLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    ...Shadows.md,
  },
  setupButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  successBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  successBadgeText: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    maxWidth: 300,
  },
  infoCardText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pinContainer: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.md,
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 6,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  pinError: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
  },
  templateCarousel: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  demoTemplateCard: {
    width: 120,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  demoTemplateIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  demoTemplateName: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  demoTemplateDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  hashDemo: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  hashDemoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  hashDemoTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  hashVerifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  hashVerifiedText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  hashDemoLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  hashDemoValue: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  hashDemoDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  hashDemoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  hashDemoRowLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  hashDemoRowValue: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '500',
  },
  // Paywall styles
  paywallTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  paywallSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  saveBanner: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  saveBannerText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  planPriceMain: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  planPricePeriod: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  planPriceBreakdown: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '500',
    marginTop: 2,
  },
  proFeaturesCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  proFeaturesTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  proFeature: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trustBadgeIcon: {
    width: 20,
    height: 20,
  },
  trustBadgeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  freePlanInfo: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  freePlanText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  // Bottom bar
  bottomBar: {
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Shadows.md,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  skipButton: {
    marginTop: Spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  skipButtonText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
});

export default OnboardingScreen;
