/**
 * Legacy PIN Screen - replaced by LockScreen.
 * Kept for backward compatibility.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface PinScreenProps {
  onSuccess: () => void;
  pinExists: boolean;
}

const PinScreen: React.FC<PinScreenProps> = ({ onSuccess, pinExists }) => {
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSetPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== pinConfirm) {
      setError('PINs do not match');
      return;
    }
    await SecureStore.setItemAsync('cnsnt-pin', pin);
    onSuccess();
  };

  const handleEnterPin = async () => {
    const storedPin = await SecureStore.getItemAsync('cnsnt-pin');
    if (storedPin === pin) {
      onSuccess();
    } else {
      setError('Incorrect PIN');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pinExists ? 'Enter PIN' : 'Set a new PIN'}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        keyboardType="numeric"
        placeholder="PIN"
        placeholderTextColor={Colors.textTertiary}
        value={pin}
        onChangeText={setPin}
      />
      {!pinExists && (
        <TextInput
          style={styles.input}
          secureTextEntry
          keyboardType="numeric"
          placeholder="Confirm PIN"
          placeholderTextColor={Colors.textTertiary}
          value={pinConfirm}
          onChangeText={setPinConfirm}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={pinExists ? handleEnterPin : handleSetPin}>
        <Text style={styles.buttonText}>{pinExists ? 'Unlock' : 'Save PIN'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.background },
  title: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.lg, color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  error: { ...Typography.bodySmall, color: Colors.error, textAlign: 'center', marginBottom: Spacing.md },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  buttonText: { ...Typography.button, color: Colors.textInverse },
});

export default PinScreen;
