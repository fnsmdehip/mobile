/**
 * Consent Builder Screen - interactive consent checklist.
 *
 * Allows user to check off consent items and export as PDF.
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const initialItems: string[] = [
  'I have read and understood the purpose of this consent.',
  'I agree to the terms and conditions laid out.',
  'I allow the recording of my voice and video (if applicable).',
  'I understand my data will be stored locally and encrypted.',
  'I can revoke consent at any time by deleting the vault.',
];

const ConsentBuilderScreen: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    initialItems.map(() => false)
  );
  const [exporting, setExporting] = useState(false);

  const toggleItem = (index: number) => {
    const updated = [...checkedItems];
    updated[index] = !updated[index];
    setCheckedItems(updated);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8" /><style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; }
        h1 { color: #1A202C; font-size: 24px; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 12px; font-size: 16px; color: #334155; }
        </style></head><body>
        <h1>Consent Checklist</h1>
        <ul>
          ${initialItems.map((item, i) => `<li>${checkedItems[i] ? '[X] ' : '[ ] '}${item}</li>`).join('')}
        </ul>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (_e) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{'\u{2705}'}</Text>
        <Text style={styles.heading}>Consent Checklist</Text>
      </View>

      <Text style={styles.description}>
        Review and check each item to confirm your understanding and consent.
      </Text>

      {initialItems.map((label, idx) => (
        <Pressable key={idx} style={styles.itemRow} onPress={() => toggleItem(idx)}>
          <View style={[styles.checkbox, checkedItems[idx] && styles.checkboxChecked]}>
            {checkedItems[idx] && (
              <Text style={styles.checkmark}>{'\u2713'}</Text>
            )}
          </View>
          <Text style={styles.itemLabel}>{label}</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
        onPress={handleExport}
        disabled={exporting}
      >
        <Text style={styles.exportButtonText}>
          {exporting ? 'Exporting...' : 'Export PDF'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  heading: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  itemLabel: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  exportButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    ...Shadows.md,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});

export default ConsentBuilderScreen;
