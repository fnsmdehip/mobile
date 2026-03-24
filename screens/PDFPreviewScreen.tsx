/**
 * PDF Preview Screen - Shows a preview of the consent record
 * before exporting. Displays document hash, signatures, and
 * allows sharing.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import StatusBadge from '../components/StatusBadge';
import db from '../services/database';
import exportService from '../services/export';
import type { ConsentRecord } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, MIN_TOUCH_SIZE, Assets } from '../constants/theme';

interface PDFPreviewScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      recordId: string;
    };
  };
}

const PDFPreviewScreen: React.FC<PDFPreviewScreenProps> = ({ navigation, route }) => {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [integrityVerified, setIntegrityVerified] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await db.getRecord(route.params.recordId);
        setRecord(r);
        if (r) {
          const verified = await db.verifyRecordIntegrity(r.id);
          setIntegrityVerified(verified);
        }
      } catch (_e) {
        Alert.alert('Error', 'Failed to load record.');
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params.recordId]);

  const handleExport = async () => {
    if (!record) return;
    setExporting(true);
    try {
      await exportService.exportAndShare(record);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>{'\u{26A0}\uFE0F'}</Text>
          <Text style={styles.errorTitle}>Record Not Found</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle} numberOfLines={2}>{record.title}</Text>
              <StatusBadge status={record.status} />
            </View>
            <Text style={styles.headerTemplate}>{record.templateName}</Text>
            <Text style={styles.headerDate}>
              Created {new Date(record.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Integrity Badge */}
          <View style={[
            styles.integrityCard,
            integrityVerified === true && styles.integrityVerified,
            integrityVerified === false && styles.integrityFailed,
          ]}>
            {integrityVerified === true ? (
              <Image source={Assets.iconShield} style={styles.integrityImage} resizeMode="contain" />
            ) : (
              <Text style={styles.integrityIcon}>
                {integrityVerified === false ? '\u{26A0}\uFE0F' : '\u{23F3}'}
              </Text>
            )}
            <View style={styles.integrityInfo}>
              <Text style={styles.integrityTitle}>
                {integrityVerified === true ? 'Document Integrity Verified' :
                 integrityVerified === false ? 'Integrity Check Failed' : 'Checking...'}
              </Text>
              {record.documentHash && (
                <Text style={styles.integrityHash}>
                  SHA-256: {record.documentHash.substring(0, 24)}...
                </Text>
              )}
            </View>
          </View>

          {/* Parties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parties</Text>
            {record.parties.map((party, i) => (
              <View key={i} style={styles.partyRow}>
                <View style={styles.partyAvatar}>
                  <Text style={styles.partyAvatarText}>
                    {party.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.partyName}>{party.name}</Text>
                  <Text style={styles.partyRole}>{party.role}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Consent Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consent Agreement</Text>
            <View style={styles.consentTextCard}>
              <Text style={styles.consentText}>{record.consentText}</Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Signatures ({record.signatures.length})
            </Text>
            {record.signatures.map((sig, i) => (
              <View key={i} style={styles.signatureCard}>
                <Text style={styles.signatureName}>{sig.partyName}</Text>
                <View style={styles.signatureImageContainer}>
                  <Text style={styles.signaturePlaceholder}>
                    [Signature on file]
                  </Text>
                </View>
                <Text style={styles.signatureTimestamp}>
                  Signed: {new Date(sig.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          {/* Expiry */}
          {record.expiresAt && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Validity</Text>
              <View style={styles.validityCard}>
                <View style={styles.validityRow}>
                  <Text style={styles.validityLabel}>Effective</Text>
                  <Text style={styles.validityValue}>
                    {new Date(record.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.validityRow}>
                  <Text style={styles.validityLabel}>Expires</Text>
                  <Text style={styles.validityValue}>
                    {new Date(record.expiresAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Record Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Record Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Record ID</Text>
                <Text style={styles.infoValue}>{record.id}</Text>
              </View>
              {record.documentHash && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Document Hash</Text>
                  <Text style={styles.infoValueMono}>{record.documentHash}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.exportButton}
            onPress={handleExport}
            disabled={exporting}
          >
            <Image source={Assets.iconPdf} style={styles.exportIconImage} resizeMode="contain" />
            <Text style={styles.exportButtonText}>
              {exporting ? 'Generating PDF...' : 'Export as PDF'}
            </Text>
          </Pressable>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  headerTemplate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  headerDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  integrityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  integrityVerified: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  integrityFailed: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  integrityIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  integrityImage: {
    width: 32,
    height: 32,
    marginRight: Spacing.md,
  },
  integrityInfo: {
    flex: 1,
  },
  integrityTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  integrityHash: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  partyAvatarText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  partyName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  partyRole: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  consentTextCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: 300,
  },
  consentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  signatureCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signatureName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  signatureImageContainer: {
    height: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.sm,
  },
  signaturePlaceholder: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  signatureTimestamp: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  validityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  validityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  validityLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  validityValue: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  infoValue: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  infoValueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.lg,
  },
  exportButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    ...Shadows.md,
  },
  exportButtonIcon: {
    fontSize: 20,
  },
  exportIconImage: {
    width: 22,
    height: 22,
  },
  exportButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});

export default PDFPreviewScreen;
