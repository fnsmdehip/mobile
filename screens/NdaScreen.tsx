/**
 * NDA Screen - Non-Disclosure Agreement form with dual signature.
 *
 * Loads NDA markdown template, fills fields, collects signatures,
 * saves securely and exports as PDF.
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Print from 'expo-print';
import Markdown from 'react-native-markdown-display';
import * as SecureStore from 'expo-secure-store';
import DualSignature from '../components/DualSignature';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const ndaAssetModule = require('../assets/templates/form-templates/nda_template.md');

const NdaScreen: React.FC = () => {
  const [ndaText, setNdaText] = useState<string>('');
  const [signatureA, setSignatureA] = useState<string | null>(null);
  const [signatureB, setSignatureB] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [disclosingParty, setDisclosingParty] = useState('');
  const [receivingParty, setReceivingParty] = useState('');
  const [scope, setScope] = useState('');
  const [term, setTerm] = useState('');
  const [governingLaw, setGoverningLaw] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(ndaAssetModule);
        await asset.downloadAsync();
        let text = await FileSystem.readAsStringAsync(asset.localUri!);
        text = text.replace(/<!--[\s\S]*?-->/g, '');
        text = text.replace(/## Signatures[\s\S]*/g, '');
        setNdaText(text);
      } catch (_e) {
        Alert.alert('Error', 'Failed to load NDA template.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getFilledText = () => {
    return ndaText
      .replace(/\[Date\]/g, date)
      .replace(/\[Disclosing Party\]/g, disclosingParty)
      .replace(/\[Receiving Party\]/g, receivingParty)
      .replace(/\[Scope\]/g, scope)
      .replace(/\[Term in years\]/g, term)
      .replace(/\[Governing Law\]/g, governingLaw);
  };

  const saveAgreement = async () => {
    if (!signatureA || !signatureB) {
      Alert.alert('Signature required', 'Please collect both signatures to continue.');
      return;
    }
    setSaving(true);
    try {
      const filled = getFilledText();
      await SecureStore.setItemAsync(
        'ndaAgreement',
        JSON.stringify({ template: filled, signatureA, signatureB, date })
      );
      Alert.alert('Saved', 'NDA saved securely.');
    } catch (_e) {
      Alert.alert('Error', 'Failed to save NDA securely.');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    try {
      const filled = getFilledText();
      const html = `<html><head><style>body{font-family:-apple-system,Helvetica,sans-serif;padding:24px;color:#1A202C;}</style></head><body><h1>Non-Disclosure Agreement</h1>${filled.replace(/\n/g, '<br/>')}<h2>Signatures</h2><img src="${signatureA}" width="200"/><br/><img src="${signatureB}" width="200"/></body></html>`;
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
        <Text style={styles.headerIcon}>{'\u{1F512}'}</Text>
        <Text style={styles.heading}>Non-Disclosure Agreement</Text>
      </View>

      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Disclosing Party" placeholderTextColor={Colors.textTertiary} value={disclosingParty} onChangeText={setDisclosingParty} />
      <TextInput style={styles.input} placeholder="Receiving Party" placeholderTextColor={Colors.textTertiary} value={receivingParty} onChangeText={setReceivingParty} />
      <TextInput style={styles.input} placeholder="Scope of Confidential Information" placeholderTextColor={Colors.textTertiary} value={scope} onChangeText={setScope} />
      <TextInput style={styles.input} placeholder="Term (years)" placeholderTextColor={Colors.textTertiary} value={term} onChangeText={setTerm} />
      <TextInput style={styles.input} placeholder="Governing Law" placeholderTextColor={Colors.textTertiary} value={governingLaw} onChangeText={setGoverningLaw} />

      <Text style={styles.previewLabel}>Agreement Preview</Text>
      {ndaText ? (
        <Markdown style={markdownStyles}>{getFilledText()}</Markdown>
      ) : (
        <Text style={styles.loadingText}>Loading NDA...</Text>
      )}

      <DualSignature
        onSignaturesCollected={(a, b) => {
          setSignatureA(a);
          setSignatureB(b);
        }}
      />

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.primaryButton, (saving || !signatureA || !signatureB) && styles.buttonDisabled]}
          onPress={saveAgreement}
          disabled={saving || !signatureA || !signatureB}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, (!signatureA || !signatureB) && styles.buttonDisabled]}
          onPress={exportPdf}
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

export default NdaScreen;
