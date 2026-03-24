/**
 * Professional Lock Screen with biometric prompt.
 * Uses icon_shield.png asset, animated unlock, PIN pad with
 * haptic-ready feedback, smooth transitions.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/auth';
import { Colors, Typography, Spacing, BorderRadius, Shadows, MIN_TOUCH_SIZE, Assets } from '../constants/theme';

interface LockScreenProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 4;
const PIN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pinIsSet, setPinIsSet] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const checkAuthState = useCallback(async () => {
    setLoading(true);
    try {
      const state = await authService.getAuthState();
      setPinIsSet(state.pinIsSet);
      setHasBiometrics(state.hasBiometrics);
      setBiometricEnabled(state.biometricEnabled);

      if (state.hasBiometrics) {
        const name = await authService.getBiometricTypeName();
        setBiometricName(name);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (state.biometricEnabled && state.pinIsSet) {
        const success = await authService.authenticateWithBiometrics();
        if (success) {
          onUnlock();
          return;
        }
      }
    } catch (_e) {
      // Silently fail - user can still use PIN
    } finally {
      setLoading(false);
    }
  }, [onUnlock, fadeAnim]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const handlePinEntry = useCallback(
    async (fullPin: string) => {
      if (!pinIsSet) {
        // Setup mode
        if (!isConfirming) {
          setConfirmPin(fullPin);
          setIsConfirming(true);
          setPin('');
          return;
        }
        if (fullPin !== confirmPin) {
          setError('PINs do not match. Try again.');
          shake();
          setIsConfirming(false);
          setConfirmPin('');
          setPin('');
          return;
        }
        setLoading(true);
        try {
          await authService.setPin(fullPin);
          onUnlock();
        } catch (_e) {
          setError('Failed to set PIN');
          shake();
          setPin('');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Auth mode
      setLoading(true);
      try {
        const success = await authService.authenticateWithPin(fullPin);
        if (success) {
          onUnlock();
        } else {
          setError('Incorrect PIN');
          shake();
          setPin('');
        }
      } catch (_e) {
        setError('Authentication failed');
        shake();
        setPin('');
      } finally {
        setLoading(false);
      }
    },
    [pinIsSet, isConfirming, confirmPin, onUnlock, shake]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (digit === 'del') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
        return;
      }
      if (digit === '') return;

      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length >= PIN_LENGTH) {
        setTimeout(() => handlePinEntry(newPin), 100);
      }
    },
    [pin, handlePinEntry]
  );

  const handleBiometric = async () => {
    setError('');
    setLoading(true);
    try {
      const success = await authService.authenticateWithBiometrics();
      if (success) {
        onUnlock();
      } else {
        setError(`${biometricName} failed. Use PIN instead.`);
      }
    } catch (_e) {
      setError('Biometric auth failed');
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    if (!pinIsSet && !isConfirming) return 'Create a PIN to secure your vault';
    if (!pinIsSet && isConfirming) return 'Confirm your PIN';
    return 'Enter your PIN to unlock';
  };

  if (loading && pin.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Image
            source={Assets.iconShield}
            style={styles.loadingShield}
            resizeMode="contain"
          />
          <Text style={styles.appNameLoading}>cnsnt</Text>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={Assets.iconShield}
            style={styles.headerShield}
            resizeMode="contain"
          />
          <Text style={styles.appName}>cnsnt</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        {/* PIN Dots */}
        <Animated.View
          style={[
            styles.dotsRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < pin.length && styles.pinDotFilled,
                error && pin.length === 0 && styles.pinDotError,
              ]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

        {/* Number Pad */}
        <View style={styles.numPad}>
          {PIN_DIGITS.map((digit, i) => (
            <Pressable
              key={i}
              style={[
                styles.numKey,
                digit === '' && styles.numKeyEmpty,
                digit === 'del' && styles.numKeyDel,
              ]}
              onPress={() => handleDigitPress(digit)}
              disabled={digit === '' || loading}
            >
              {digit === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color={Colors.textSecondary} />
              ) : (
                <Text style={styles.numKeyText}>
                  {digit}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Biometric Button */}
        {pinIsSet && biometricEnabled && hasBiometrics && (
          <Pressable style={styles.biometricButton} onPress={handleBiometric}>
            <Text style={styles.biometricText}>
              Use {biometricName}
            </Text>
          </Pressable>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Encrypted locally on this device
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingShield: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  appNameLoading: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  headerShield: {
    width: 48,
    height: 48,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: Spacing.lg,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinDotError: {
    borderColor: Colors.error,
  },
  error: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    minHeight: 20,
  },
  errorSpacer: {
    minHeight: 20,
    marginBottom: Spacing.lg,
  },
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  numKey: {
    width: 80,
    height: 80,
    margin: 6,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
  },
  numKeyEmpty: {
    backgroundColor: 'transparent',
  },
  numKeyDel: {
    backgroundColor: 'transparent',
  },
  numKeyText: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  numKeyDelText: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  biometricButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: Spacing.xl,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  biometricText: {
    ...Typography.button,
    color: Colors.primary,
  },
  footer: {
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});

export default LockScreen;
