/**
 * Settings Screen - Professional subscription management and security settings.
 * Clean grouped sections, toggle switches, subscription card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import authService from '../services/auth';
import db from '../services/database';
import exportService from '../services/export';
import purchaseService from '../services/purchases';
import { Colors, Typography, Spacing, BorderRadius, Shadows, MIN_TOUCH_SIZE, PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE, FREE_TIER_LIMIT, Assets } from '../constants/theme';
import type { Entitlement } from '../types';

interface SettingsProps {
  navigation: {
    navigate: (screen: string) => void;
  };
  onLock: () => void;
}

const AUTO_LOCK_OPTIONS = [1, 2, 5, 10, 15, 30];

const Settings: React.FC<SettingsProps> = ({ onLock }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [entitlement, setEntitlement] = useState<Entitlement>('free');
  const [recordCount, setRecordCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const state = await authService.getAuthState();
      setBiometricEnabled(state.biometricEnabled);
      setHasBiometrics(state.hasBiometrics);
      setAutoLockMinutes(state.autoLockMinutes);

      if (state.hasBiometrics) {
        const name = await authService.getBiometricTypeName();
        setBiometricName(name);
      }

      const purchaseState = await purchaseService.getPurchaseState();
      setEntitlement(purchaseState.entitlement);
      setRecordCount(purchaseState.recordCount);
    } catch (_error) {
      Alert.alert('Error', 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await authService.authenticateWithBiometrics();
      if (!success) {
        Alert.alert('Authentication Required', `Please verify with ${biometricName} to enable it.`);
        return;
      }
    }
    await authService.setBiometricEnabled(value);
    setBiometricEnabled(value);
  };

  const handleAutoLockChange = async (minutes: number) => {
    await authService.setAutoLockTimeout(minutes);
    setAutoLockMinutes(minutes);
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const records = await db.getAllRecords();
      if (records.length === 0) {
        Alert.alert('No Data', 'There are no consent records to export.');
        return;
      }
      const uri = await exportService.exportAllAsJson(records);
      await exportService.shareFile(uri);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to export.';
      Alert.alert('Export Error', msg);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all consent records, encryption keys, and authentication data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All data will be permanently destroyed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await db.deleteAllRecords();
                      await authService.resetAll();
                      Alert.alert('Deleted', 'All data has been removed.', [
                        { text: 'OK', onPress: () => onLock() },
                      ]);
                    } catch (error: unknown) {
                      const msg = error instanceof Error ? error.message : 'Failed to delete.';
                      Alert.alert('Error', msg);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLockNow = () => {
    authService.lock();
    onLock();
  };

  const handleUpgrade = async () => {
    const success = await purchaseService.purchasePro();
    if (success) {
      setEntitlement('pro');
      Alert.alert('Welcome to Pro!', 'You now have unlimited access.');
    } else {
      Alert.alert(
        'Upgrade',
        'Pro subscription requires a custom dev client build with RevenueCat SDK. The app currently operates in free mode.'
      );
    }
  };

  const handleRestorePurchases = async () => {
    const result = await purchaseService.restorePurchases();
    if (result === 'pro') {
      setEntitlement('pro');
      Alert.alert('Restored', 'Pro subscription restored.');
    } else {
      Alert.alert('No Purchase Found', 'No active Pro subscription was found.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Subscription */}
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={[styles.subscriptionCard, entitlement === 'pro' && styles.subscriptionCardPro]}>
            <View style={styles.subscriptionHeader}>
              <View style={[styles.planBadge, entitlement === 'pro' && styles.planBadgePro]}>
                <Text style={[styles.planBadgeText, entitlement === 'pro' && styles.planBadgeTextPro]}>
                  {entitlement === 'pro' ? 'PRO' : 'FREE'}
                </Text>
              </View>
            </View>
            {entitlement === 'free' ? (
              <>
                <View style={styles.usageBar}>
                  <View style={styles.usageTrack}>
                    <View style={[styles.usageFill, { width: `${(recordCount / FREE_TIER_LIMIT) * 100}%` }]} />
                  </View>
                  <Text style={styles.usageText}>{recordCount} / {FREE_TIER_LIMIT} records used</Text>
                </View>
                <View style={styles.proFeaturesList}>
                  {[
                    'Unlimited consent records',
                    'All 8 premium templates',
                    'Audio recording',
                    'Priority support',
                  ].map((f, i) => (
                    <Text key={i} style={styles.proFeature}>{'\u2713'}  {f}</Text>
                  ))}
                </View>
                <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to Pro - {PRO_YEARLY_PRICE}/year
                  </Text>
                </Pressable>
                <Text style={styles.yearlyOption}>or {PRO_MONTHLY_PRICE}/month</Text>
              </>
            ) : (
              <Text style={styles.proActiveText}>
                Unlimited records, all templates, audio recording.
              </Text>
            )}
            <Pressable style={styles.restoreButton} onPress={handleRestorePurchases}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>
          </View>

          {/* Security */}
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingsGroup}>
            {hasBiometrics && (
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <Image source={Assets.iconShield} style={styles.settingImage} resizeMode="contain" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{biometricName} Unlock</Text>
                  <Text style={styles.settingDescription}>Use {biometricName} to unlock</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
                  thumbColor={biometricEnabled ? Colors.primary : Colors.surfaceElevated}
                />
              </View>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Image source={Assets.iconCloudLock} style={styles.settingImage} resizeMode="contain" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Lock Timeout</Text>
                <Text style={styles.settingDescription}>Lock after inactivity</Text>
              </View>
            </View>
            <View style={styles.optionsRow}>
              {AUTO_LOCK_OPTIONS.map((minutes) => (
                <Pressable
                  key={minutes}
                  style={[
                    styles.optionChip,
                    autoLockMinutes === minutes && styles.optionChipActive,
                  ]}
                  onPress={() => handleAutoLockChange(minutes)}
                >
                  <Text style={[
                    styles.optionChipText,
                    autoLockMinutes === minutes && styles.optionChipTextActive,
                  ]}>
                    {minutes}m
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.settingAction} onPress={handleLockNow}>
              <View style={styles.settingIconContainer}>
                <Image source={Assets.iconShield} style={styles.settingImage} resizeMode="contain" />
              </View>
              <Text style={styles.settingActionText}>Lock Now</Text>
            </Pressable>
          </View>

          {/* Data */}
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingAction}
              onPress={handleExportAll}
              disabled={exporting}
            >
              <View style={styles.settingIconContainer}>
                <Image source={Assets.iconPdf} style={styles.settingImage} resizeMode="contain" />
              </View>
              <Text style={styles.settingActionText}>
                {exporting ? 'Exporting...' : `Export All Data (${recordCount} records)`}
              </Text>
            </Pressable>

            <Pressable style={[styles.settingAction, styles.settingActionDanger]} onPress={handleDeleteAll}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.errorLight }]}>
                <Text style={styles.settingIcon}>{'\u{1F5D1}'}</Text>
              </View>
              <Text style={styles.settingActionDangerText}>Delete All Data</Text>
            </Pressable>
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutAppName}>cnsnt</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Secure consent record management. All data is encrypted and stored locally on your device.
            </Text>
            <View style={styles.aboutDivider} />
            <Text style={styles.legalText}>
              This app is a record management tool, not a substitute for professional advice.
            </Text>
            <View style={styles.legalLinks}>
              <Pressable style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </Pressable>
              <Text style={styles.legalDot}>{'\u{2022}'}</Text>
              <Pressable style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  subscriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  subscriptionCardPro: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  subscriptionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  planBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  planBadgePro: {
    backgroundColor: Colors.primary,
  },
  planBadgeText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  planBadgeTextPro: {
    color: Colors.textInverse,
  },
  usageBar: {
    marginBottom: Spacing.lg,
  },
  usageTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  usageFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  usageText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  proFeaturesList: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  proFeature: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    ...Shadows.md,
  },
  upgradeButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  yearlyOption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  proActiveText: {
    ...Typography.body,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  restoreButton: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreText: {
    ...Typography.bodySmall,
    color: Colors.textLink,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    minHeight: MIN_TOUCH_SIZE,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  optionChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  optionChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    minHeight: MIN_TOUCH_SIZE,
  },
  settingActionText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  settingActionDanger: {
    borderBottomWidth: 0,
  },
  settingActionDangerText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.xxl,
  },
  aboutAppName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 3,
  },
  aboutVersion: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  aboutDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    alignSelf: 'stretch',
    marginVertical: Spacing.lg,
  },
  legalText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legalLink: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  legalLinkText: {
    ...Typography.bodySmall,
    color: Colors.textLink,
  },
  legalDot: {
    color: Colors.textTertiary,
  },
});

export default Settings;
