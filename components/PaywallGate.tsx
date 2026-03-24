/**
 * Paywall Gate component.
 * Wraps premium features and shows upgrade prompt for free users.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE, Assets } from '../constants/theme';
import purchaseService from '../services/purchases';

interface PaywallGateProps {
  feature: 'recording' | 'templates' | 'create_record';
  children: React.ReactNode;
  isAllowed: boolean;
}

const FEATURE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  recording: {
    title: 'Audio Recording',
    description: 'Record audio consent alongside your signed documents for complete records.',
  },
  templates: {
    title: 'Premium Templates',
    description: 'Access NDA, GDPR, research, and property consent templates.',
  },
  create_record: {
    title: 'Unlimited Records',
    description: 'Create unlimited consent records. Free tier allows 5 records.',
  },
};

const PaywallGate: React.FC<PaywallGateProps> = ({
  feature,
  children,
  isAllowed,
}) => {
  const [showModal, setShowModal] = useState(false);

  if (isAllowed) {
    return <>{children}</>;
  }

  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  const handleUpgrade = async () => {
    const success = await purchaseService.purchasePro();
    if (success) {
      setShowModal(false);
    } else {
      Alert.alert(
        'Upgrade',
        'To upgrade to Pro, the RevenueCat SDK needs to be configured in a custom dev client build. For now, the app operates in free mode.'
      );
    }
  };

  const handleRestore = async () => {
    const entitlement = await purchaseService.restorePurchases();
    if (entitlement === 'pro') {
      Alert.alert('Restored', 'Pro subscription restored successfully!');
      setShowModal(false);
    } else {
      Alert.alert('No Purchase Found', 'No active Pro subscription was found.');
    }
  };

  return (
    <>
      <Pressable style={styles.lockedContainer} onPress={() => setShowModal(true)}>
        <View style={styles.lockedOverlay}>
          <Ionicons name="lock-closed-outline" size={32} color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }} />
          <Text style={styles.lockedTitle}>Pro Feature</Text>
          <Text style={styles.lockedSubtitle}>Tap to learn more</Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upgrade to Pro</Text>
            <Text style={styles.featureTitle}>{featureInfo.title}</Text>
            <Text style={styles.featureDescription}>
              {featureInfo.description}
            </Text>

            <View style={styles.pricingBox}>
              <Text style={styles.price}>{PRO_YEARLY_PRICE}</Text>
              <Text style={styles.priceUnit}>/year</Text>
            </View>
            <Text style={styles.pricingAlt}>or {PRO_MONTHLY_PRICE}/month</Text>

            <View style={styles.benefitsList}>
              <Text style={styles.benefit}>
                {'\u2713'} Unlimited consent records
              </Text>
              <Text style={styles.benefit}>
                {'\u2713'} Audio recording
              </Text>
              <Text style={styles.benefit}>
                {'\u2713'} All 8 premium templates
              </Text>
              <Text style={styles.benefit}>
                {'\u2713'} PDF export with SHA-256 hash
              </Text>
              <Text style={styles.benefit}>
                {'\u2713'} Cloud backup
              </Text>
            </View>

            <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </Pressable>

            <Pressable onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  lockedContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  lockedOverlay: {
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  lockedTitle: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  lockedSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  featureTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  featureDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '300',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  pricingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  pricingAlt: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  benefit: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  upgradeButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  restoreText: {
    ...Typography.bodySmall,
    color: Colors.textLink,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    paddingVertical: Spacing.sm,
  },
  closeButtonText: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
});

export default PaywallGate;
