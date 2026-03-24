/**
 * Sexual Consent Screen - Consent agreement with optional clauses.
 *
 * Features toggles for optional sections (STI, Media, Non-Disparagement, Indemnification).
 */

import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, Switch, Pressable, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const consentAsset = require('../assets/templates/nda_sexual_consent.md');

const SexualConsentScreen: React.FC = () => {
  const [template, setTemplate] = useState<string>('');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [includeSTI, setIncludeSTI] = useState(true);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeNonDisparagement, setIncludeNonDisparagement] = useState(true);
  const [includeIndemnification, setIncludeIndemnification] = useState(true);
  const sigRef = useRef<SignatureViewRef | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(consentAsset);
        await asset.downloadAsync();
        const text = await FileSystem.readAsStringAsync(asset.localUri!);
        setTemplate(text);
      } catch (_e) {
        Alert.alert('Error', 'Failed to load consent template.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getProcessedTemplate = () => {
    let processed = template;
    if (!includeSTI) {
      processed = processed.replace(/<!-- STI_SCREENING_START -->[\s\S]*?<!-- STI_SCREENING_END -->\n?/, '');
    }
    if (!includeMedia) {
      processed = processed.replace(/<!-- MEDIA_RELEASE_START -->[\s\S]*?<!-- MEDIA_RELEASE_END -->\n?/, '');
    }
    if (!includeNonDisparagement) {
      processed = processed.replace(/<!-- NON_DISPARAGEMENT_START -->[\s\S]*?<!-- NON_DISPARAGEMENT_END -->\n?/, '');
    }
    if (!includeIndemnification) {
      processed = processed.replace(/<!-- INDEMNIFICATION_START -->[\s\S]*?<!-- INDEMNIFICATION_END -->\n?/, '');
    }
    return processed;
  };

  const handleSignature = (sig: string) => setSignature(sig);

  const saveConsent = async () => {
    if (!signature) {
      Alert.alert('Signature required', 'Please sign to continue.');
      return;
    }
    setSaving(true);
    try {
      const processed = getProcessedTemplate();
      const filled = processed
        .replace(/\[Date\]/g, date)
        .replace(/\[Party A\]/g, partyA)
        .replace(/\[Party B\]/g, partyB);
      const record = { template: filled, signature, date };
      await AsyncStorage.setItem('sexualConsent', JSON.stringify(record));
      Alert.alert('Saved', 'Sexual Consent Agreement saved locally.');
    } catch (_e) {
      Alert.alert('Error', 'Failed to save agreement.');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    try {
      const processed = getProcessedTemplate();
      const filled = processed
        .replace(/\[Date\]/g, date)
        .replace(/\[Party A\]/g, partyA)
        .replace(/\[Party B\]/g, partyB);
      const html = `<html><head><style>body{font-family:-apple-system,Helvetica,sans-serif;padding:24px;color:#1A202C;}</style></head><body><h1>Sexual Consent Agreement</h1>${filled.replace(/\n/g, '<br/>')}<h2>Signature</h2><img src="${signature}" width="300"/></body></html>`;
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
      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include STI Screening</Text>
          <Switch
            value={includeSTI}
            onValueChange={setIncludeSTI}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={includeSTI ? Colors.primary : Colors.surfaceElevated}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include Media & Publicity</Text>
          <Switch
            value={includeMedia}
            onValueChange={setIncludeMedia}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={includeMedia ? Colors.primary : Colors.surfaceElevated}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include Non-Disparagement</Text>
          <Switch
            value={includeNonDisparagement}
            onValueChange={setIncludeNonDisparagement}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={includeNonDisparagement ? Colors.primary : Colors.surfaceElevated}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include Indemnification</Text>
          <Switch
            value={includeIndemnification}
            onValueChange={setIncludeIndemnification}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={includeIndemnification ? Colors.primary : Colors.surfaceElevated}
          />
        </View>
      </View>

      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Party A" placeholderTextColor={Colors.textTertiary} value={partyA} onChangeText={setPartyA} />
      <TextInput style={styles.input} placeholder="Party B" placeholderTextColor={Colors.textTertiary} value={partyB} onChangeText={setPartyB} />

      <Text style={styles.previewLabel}>Agreement Preview</Text>
      {template ? (
        <Markdown style={markdownStyles}>
          {getProcessedTemplate()
            .replace(/\[Date\]/g, date)
            .replace(/\[Party A\]/g, partyA)
            .replace(/\[Party B\]/g, partyB)}
        </Markdown>
      ) : (
        <Text style={styles.loadingText}>Loading...</Text>
      )}

      <Text style={styles.signLabel}>Sign Below</Text>
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={sigRef}
          onOK={handleSignature}
          descriptionText="Sign above"
          clearText="Clear"
          confirmText="Save Signature"
          webStyle={`.m-signature-pad--footer {display: flex;} .m-signature-pad {box-shadow: none; border: none;}`}
        />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={saveConsent}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, !signature && styles.buttonDisabled]}
          onPress={exportPdf}
          disabled={!signature}
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
  switchContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  switchLabel: { ...Typography.body, color: Colors.textPrimary },
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
  signLabel: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginVertical: Spacing.md },
  signatureContainer: { height: 200, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.lg },
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

export default SexualConsentScreen;
