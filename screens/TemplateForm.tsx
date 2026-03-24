/**
 * Template Form Screen - Professional consent record builder.
 * Progress indicator, field animations, signature capture,
 * PDF preview before export, premium feel throughout.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureCanvas from 'react-native-signature-canvas';
import ErrorBoundary from '../components/ErrorBoundary';
import { getTemplateById, fillTemplate } from '../data/templates';
import db from '../services/database';
import exportService from '../services/export';
import purchaseService from '../services/purchases';
import type { ConsentRecord, SignatureData, PartyInfo } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, MIN_TOUCH_SIZE, Assets } from '../constants/theme';

interface TemplateFormProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: {
    params: {
      templateId: string;
    };
  };
}

const TemplateForm: React.FC<TemplateFormProps> = ({ navigation, route }) => {
  const template = getTemplateById(route.params.templateId);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatureA, setSignatureA] = useState<string | null>(null);
  const [signatureB, setSignatureB] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedRecord, setSavedRecord] = useState<ConsentRecord | null>(null);
  const [activeFieldIndex, setActiveFieldIndex] = useState(-1);

  // Animate progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate form completion
  const totalRequired = useMemo(() => {
    if (!template) return 0;
    let count = template.fields.filter((f) => f.required).length;
    count += 1; // signature A
    if (template.requiresDualSignature) count += 1;
    return count;
  }, [template]);

  const completedCount = useMemo(() => {
    if (!template) return 0;
    let count = template.fields.filter(
      (f) => f.required && fieldValues[f.key]?.trim()
    ).length;
    if (signatureA) count += 1;
    if (template.requiresDualSignature && signatureB) count += 1;
    return count;
  }, [template, fieldValues, signatureA, signatureB]);

  const progress = totalRequired > 0 ? completedCount / totalRequired : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>{'\u{26A0}\uFE0F'}</Text>
          </View>
          <Text style={styles.errorTitle}>Template Not Found</Text>
          <Text style={styles.errorText}>
            The selected template could not be loaded.
          </Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const filledText = fillTemplate(template, fieldValues);

  const updateField = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = (): boolean => {
    for (const field of template.fields) {
      if (field.required && !fieldValues[field.key]?.trim()) return false;
    }
    if (!signatureA) return false;
    if (template.requiresDualSignature && !signatureB) return false;
    return true;
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields and provide signature(s).');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      const parties: PartyInfo[] = [];
      const nameFields = template.fields.filter(
        (f) => f.key.toLowerCase().includes('name') || f.key.toLowerCase().includes('party')
      );
      for (const f of nameFields) {
        if (fieldValues[f.key]) {
          parties.push({ name: fieldValues[f.key], role: f.label });
        }
      }

      const signatures: SignatureData[] = [];
      if (signatureA) {
        signatures.push({
          partyName: parties[0]?.name || 'Party A',
          signatureImage: signatureA,
          timestamp: now,
        });
      }
      if (signatureB && template.requiresDualSignature) {
        signatures.push({
          partyName: parties[1]?.name || 'Party B',
          signatureImage: signatureB,
          timestamp: now,
        });
      }

      let expiresAt: string | null = null;
      if (template.defaultExpiryDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + template.defaultExpiryDays);
        expiresAt = expiry.toISOString();
      }

      const record = await db.createRecord({
        templateId: template.id,
        templateName: template.name,
        title: `${template.name} - ${parties[0]?.name || 'Untitled'}`,
        status: 'active',
        createdAt: now,
        expiresAt,
        revokedAt: null,
        parties,
        consentText: filledText,
        signatures,
        recordingUri: null,
        recordingDuration: null,
        pdfUri: null,
        documentHash: null,
        metadata: fieldValues,
      });

      const count = await db.getRecordCount();
      await purchaseService.updateRecordCount(count);

      setSavedRecord(record);
      setSaved(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save consent record.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!savedRecord) return;
    try {
      await exportService.exportAndShare(savedRecord);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to export PDF.';
      Alert.alert('Export Error', msg);
    }
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressBarWidth },
                progress >= 1 && styles.progressComplete,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% complete
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Template Header */}
            <View style={styles.templateHeader}>
              <View style={styles.templateIconContainer}>
                <Text style={styles.templateIcon}>{template.icon}</Text>
              </View>
              <View style={styles.templateHeaderText}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              {template.fields.map((field, index) => (
                <View
                  key={field.key}
                  style={[
                    styles.fieldContainer,
                    activeFieldIndex === index && styles.fieldContainerActive,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <Text style={styles.requiredStar}> *</Text>}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      field.type === 'multiline' && styles.fieldInputMultiline,
                      activeFieldIndex === index && styles.fieldInputActive,
                      fieldValues[field.key]?.trim() && styles.fieldInputFilled,
                    ]}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textTertiary}
                    value={fieldValues[field.key] || ''}
                    onChangeText={(text) => updateField(field.key, text)}
                    onFocus={() => setActiveFieldIndex(index)}
                    onBlur={() => setActiveFieldIndex(-1)}
                    multiline={field.type === 'multiline'}
                    numberOfLines={field.type === 'multiline' ? 4 : 1}
                    keyboardType={
                      field.type === 'email' ? 'email-address'
                        : field.type === 'number' ? 'numeric'
                        : 'default'
                    }
                    textAlignVertical={field.type === 'multiline' ? 'top' : 'center'}
                  />
                  {fieldValues[field.key]?.trim() && field.required && (
                    <Text style={styles.fieldCheck}>{'\u2713'}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Consent Text Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Consent Preview</Text>
              <View style={styles.previewCard}>
                <ScrollView style={styles.previewScroll} nestedScrollEnabled>
                  <Text style={styles.previewText}>{filledText}</Text>
                </ScrollView>
              </View>
            </View>

            {/* Signatures */}
            <View style={styles.signatureSection}>
              <Text style={styles.sectionTitle}>
                {template.requiresDualSignature ? 'Signature - Party A' : 'Signature'}
              </Text>
              <View style={styles.signatureCanvas}>
                <SignatureCanvas
                  onOK={(sig: string) => setSignatureA(sig)}
                  onEnd={() => {}}
                  descriptionText="Sign here"
                  clearText="Clear"
                  confirmText="Save Signature"
                  webStyle=".m-signature-pad--footer {display: flex;} .m-signature-pad {box-shadow: none; border: none;}"
                />
              </View>
              {signatureA && (
                <View style={styles.signatureConfirmRow}>
                  <Text style={styles.signatureConfirm}>{'\u2713'} Signature captured</Text>
                </View>
              )}

              {template.requiresDualSignature && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
                    Signature - Party B
                  </Text>
                  <View style={styles.signatureCanvas}>
                    <SignatureCanvas
                      onOK={(sig: string) => setSignatureB(sig)}
                      onEnd={() => {}}
                      descriptionText="Sign here"
                      clearText="Clear"
                      confirmText="Save Signature"
                      webStyle=".m-signature-pad--footer {display: flex;} .m-signature-pad {box-shadow: none; border: none;}"
                    />
                  </View>
                  {signatureB && (
                    <View style={styles.signatureConfirmRow}>
                      <Text style={styles.signatureConfirm}>{'\u2713'} Signature captured</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Expiry Notice */}
            {template.defaultExpiryDays != null && (
              <View style={styles.expiryNotice}>
                <Text style={styles.expiryIcon}>{'\u{23F3}'}</Text>
                <Text style={styles.expiryText}>
                  This consent will expire {template.defaultExpiryDays} days after signing.
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {!saved ? (
                <Pressable
                  style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving || !isFormValid()}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Encrypting & Saving...' : 'Save Consent Record'}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <View style={styles.savedIndicator}>
                    <Image source={Assets.iconShield} style={styles.savedIconImage} resizeMode="contain" />
                    <View>
                      <Text style={styles.savedText}>Record Saved & Encrypted</Text>
                      {savedRecord?.documentHash && (
                        <Text style={styles.savedHash}>
                          SHA-256: {savedRecord.documentHash.substring(0, 16)}...
                        </Text>
                      )}
                    </View>
                  </View>
                  <Pressable style={styles.exportButton} onPress={handleExport}>
                    <Image source={Assets.iconPdf} style={styles.exportIconImage} resizeMode="contain" />
                    <Text style={styles.exportButtonText}>Export as PDF</Text>
                  </Pressable>
                  <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: Colors.success,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  templateIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  templateIcon: {
    fontSize: 28,
  },
  templateHeaderText: {
    flex: 1,
  },
  templateName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  fieldContainerActive: {},
  fieldLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  requiredStar: {
    color: Colors.error,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingRight: 36,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  fieldInputMultiline: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  fieldInputActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  fieldInputFilled: {
    borderColor: Colors.success,
  },
  fieldCheck: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    fontSize: 16,
    color: Colors.success,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: 250,
    overflow: 'hidden',
  },
  previewScroll: {
    padding: Spacing.lg,
  },
  previewText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  signatureSection: {
    marginBottom: Spacing.lg,
  },
  signatureCanvas: {
    height: 200,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  signatureConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  signatureConfirm: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '500',
  },
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  expiryIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  expiryText: {
    ...Typography.bodySmall,
    color: '#92400E',
    flex: 1,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  savedIndicator: {
    backgroundColor: Colors.successLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  savedIcon: {
    fontSize: 28,
  },
  savedIconImage: {
    width: 32,
    height: 32,
  },
  savedText: {
    ...Typography.body,
    color: '#065F46',
    fontWeight: '600',
  },
  savedHash: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  exportButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minHeight: MIN_TOUCH_SIZE,
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
    color: Colors.primary,
  },
  doneButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
  },
  doneButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
});

export default TemplateForm;
