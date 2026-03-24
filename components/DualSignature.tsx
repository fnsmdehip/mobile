/**
 * Dual Signature component for collecting two party signatures.
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export interface DualSignatureProps {
  onSignaturesCollected: (disclosing: string, receiving: string) => void;
}

const DualSignature: React.FC<DualSignatureProps> = ({ onSignaturesCollected }) => {
  const [sigA, setSigA] = useState<string | null>(null);
  const [sigB, setSigB] = useState<string | null>(null);
  const refA = useRef<SignatureViewRef | null>(null);
  const refB = useRef<SignatureViewRef | null>(null);

  const handleOKA = (signature: string) => {
    setSigA(signature);
    if (sigB) onSignaturesCollected(signature, sigB);
  };

  const handleOKB = (signature: string) => {
    setSigB(signature);
    if (sigA) onSignaturesCollected(sigA, signature);
  };

  return (
    <View>
      <Text style={styles.label}>Disclosing Party Signature</Text>
      <View style={styles.container}>
        <SignatureCanvas
          ref={refA}
          onOK={handleOKA}
          onEnd={() => refA.current?.readSignature()}
          descriptionText="Sign as Disclosing Party"
          clearText="Clear"
          confirmText="Save"
          webStyle=".m-signature-pad--footer {display: flex;} .m-signature-pad {box-shadow: none; border: none;}"
        />
      </View>
      {sigA && <Text style={styles.capturedText}>{'\u2713'} Signature captured</Text>}

      <Text style={styles.label}>Receiving Party Signature</Text>
      <View style={styles.container}>
        <SignatureCanvas
          ref={refB}
          onOK={handleOKB}
          onEnd={() => refB.current?.readSignature()}
          descriptionText="Sign as Receiving Party"
          clearText="Clear"
          confirmText="Save"
          webStyle=".m-signature-pad--footer {display: flex;} .m-signature-pad {box-shadow: none; border: none;}"
        />
      </View>
      {sigB && <Text style={styles.capturedText}>{'\u2713'} Signature captured</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...Typography.label,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginVertical: Spacing.md,
  },
  container: {
    height: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  capturedText: {
    ...Typography.bodySmall,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
});

export default DualSignature;
