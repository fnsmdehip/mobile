/**
 * Waiver Screen - Liability Waiver form with dual signature.
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import DualSignature from '../components/DualSignature';
import * as SecureStore from 'expo-secure-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const waiverTemplate = require('../assets/templates/form-templates/waiver_template.md');

const WaiverScreen: React.FC = () => {
  const [template, setTemplate] = useState<string>('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [organization, setOrganization] = useState('');
  const [signatureA, setSignatureA] = useState<string | null>(null);
  const [signatureB, setSignatureB] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(waiverTemplate);
        await asset.downloadAsync();
        let text = await FileSystem.readAsStringAsync(asset.localUri!);
        text = text.replace(/## Signature[\s\S]*/g, '');
        setTemplate(text);
      } catch (_e) {
        Alert.alert('Error', 'Failed to load waiver template.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getFilledText = () => {
    return template
      .replace(/\[Name\]/g, name)
      .replace(/\[Date\]/g, date)
      .replace(/\[Location\]/g, location)
      .replace(/\[Organization\]/g, organization);
  };

  const saveWaiver = async () => {
    if (!signatureA || !signatureB) {
      Alert.alert('Signature required', 'Please collect both signatures to continue.');
      return;
    }
    setSaving(true);
    try {
      const filled = getFilledText();
      await SecureStore.setItemAsync('waiver', JSON.stringify({ template: filled, signatureA, signatureB, date }));
      Alert.alert('Saved', 'Waiver saved securely.');
    } catch (_e) {
      Alert.alert('Error', 'Failed to save waiver.');
    } finally {
      setSaving(false);
    }
  };

  const exportWaiver = async () => {
    try {
      const filled = getFilledText();
      const html = `<html><head><style>body{font-family:-apple-system,Helvetica,sans-serif;padding:24px;color:#1A202C;}</style></head><body><h1>Liability Waiver</h1>${filled.replace(/\n/g, '<br/>')}<h2>Signatures</h2><img src="${signatureA}" width="200"/><br/><img src="${signatureB}" width="200"/></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (_e) {
      Alert.alert('Error', 'Failed to export PDF.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{'\u{26A0}\uFE0F'}</Text>
        <Text style={styles.heading}>Liability Waiver</Text>
      </View>

      <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Location" placeholderTextColor={Colors.textTertiary} value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Organization" placeholderTextColor={Colors.textTertiary} value={organization} onChangeText={setOrganization} />

      <Text style={styles.previewLabel}>Preview</Text>
      {template ? (
        <Markdown style={markdownStyles}>{getFilledText()}</Markdown>
      ) : (
        <Text style={styles.loadingText}>Loading...</Text>
      )}

      <DualSignature onSignaturesCollected={(a, b) => { setSignatureA(a); setSignatureB(b); }} />

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.primaryButton, (saving || !signatureA || !signatureB) && styles.buttonDisabled]}
          onPress={saveWaiver}
          disabled={saving || !signatureA || !signatureB}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, (!signatureA || !signatureB) && styles.buttonDisabled]}
          onPress={exportWaiver}
          disabled={!signatureA || !signatureB}
        >
          <Text style={styles.secondaryButtonText}>Export PDF</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  headerIcon: { fontSize: 28, marginRight: Spacing.md },
  heading: { ...Typography.h2, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  previewLabel: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginVertical: Spacing.md },
  loadingText: { ...Typography.body, color: Colors.textTertiary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.lg },
  primaryButton: { flex: 1, backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center', ...Shadows.md },
  primaryButtonText: { ...Typography.button, color: Colors.textInverse },
  secondaryButton: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  secondaryButtonText: { ...Typography.button, color: Colors.primary },
  buttonDisabled: { opacity: 0.5 },
});

const markdownStyles = {
  heading1: { fontSize: 24, lineHeight: 32, color: Colors.textPrimary },
  body: { fontSize: 16, lineHeight: 24, color: Colors.textSecondary },
};

export default WaiverScreen;
