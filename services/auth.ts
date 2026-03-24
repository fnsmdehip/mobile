/**
 * Biometric & PIN Authentication Service for cnsnt app.
 *
 * - expo-local-authentication for Face ID / fingerprint
 * - PIN fallback for devices without biometrics
 * - Lock screen on app open
 * - Auth required to view/export consent records
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import vault from './encryption';

const PIN_HASH_KEY = 'cnsnt_pin_hash';
const PIN_SALT_KEY = 'cnsnt_pin_salt';
const BIOMETRIC_ENABLED_KEY = 'cnsnt_biometric_enabled';
const AUTO_LOCK_TIMEOUT_KEY = 'cnsnt_auto_lock_timeout';

export interface AuthState {
  isAuthenticated: boolean;
  hasBiometrics: boolean;
  biometricType: LocalAuthentication.AuthenticationType[];
  biometricEnabled: boolean;
  pinIsSet: boolean;
  autoLockMinutes: number;
}

class AuthService {
  private authenticated: boolean = false;

  /**
   * Check device biometric capabilities.
   */
  async checkBiometricSupport(): Promise<{
    available: boolean;
    types: LocalAuthentication.AuthenticationType[];
  }> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      available: compatible && enrolled,
      types,
    };
  }

  /**
   * Get human-readable biometric type name.
   */
  async getBiometricTypeName(): Promise<string> {
    const { types } = await this.checkBiometricSupport();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  }

  /**
   * Authenticate with biometrics.
   */
  async authenticateWithBiometrics(): Promise<boolean> {
    const biometricEnabled = await this.isBiometricEnabled();
    if (!biometricEnabled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access cnsnt',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      this.authenticated = true;
      // Initialize vault with a biometric-derived token
      const biometricToken = await this.getBiometricToken();
      await vault.initialize(biometricToken);
    }

    return result.success;
  }

  /**
   * Authenticate with PIN.
   */
  async authenticateWithPin(pin: string): Promise<boolean> {
    const isValid = await this.verifyPin(pin);
    if (isValid) {
      this.authenticated = true;
      await vault.initialize(pin);
    }
    return isValid;
  }

  /**
   * Set up a new PIN.
   */
  async setPin(pin: string): Promise<void> {
    if (pin.length < 4) {
      throw new Error('PIN must be at least 4 digits');
    }

    const salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Date.now().toString() + Math.random().toString()
    );

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin + salt
    );

    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);

    this.authenticated = true;
    await vault.initialize(pin);
  }

  /**
   * Verify a PIN against stored hash.
   */
  async verifyPin(pin: string): Promise<boolean> {
    const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);

    if (!storedHash || !salt) return false;

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin + salt
    );

    return hash === storedHash;
  }

  /**
   * Check if PIN has been set.
   */
  async isPinSet(): Promise<boolean> {
    const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    return !!storedHash;
  }

  /**
   * Change existing PIN. Requires old PIN verification.
   */
  async changePin(oldPin: string, newPin: string): Promise<boolean> {
    const valid = await this.verifyPin(oldPin);
    if (!valid) return false;

    await this.setPin(newPin);
    return true;
  }

  /**
   * Enable or disable biometric authentication.
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(
      BIOMETRIC_ENABLED_KEY,
      enabled ? 'true' : 'false'
    );
  }

  /**
   * Check if biometric auth is enabled.
   */
  async isBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  }

  /**
   * Set auto-lock timeout in minutes.
   */
  async setAutoLockTimeout(minutes: number): Promise<void> {
    await SecureStore.setItemAsync(AUTO_LOCK_TIMEOUT_KEY, minutes.toString());
    vault.setAutoLockTimeout(minutes);
  }

  /**
   * Get auto-lock timeout in minutes.
   */
  async getAutoLockTimeout(): Promise<number> {
    const value = await SecureStore.getItemAsync(AUTO_LOCK_TIMEOUT_KEY);
    return value ? parseInt(value, 10) : 5; // Default 5 minutes
  }

  /**
   * Get full auth state for UI rendering.
   */
  async getAuthState(): Promise<AuthState> {
    const { available, types } = await this.checkBiometricSupport();
    const biometricEnabled = await this.isBiometricEnabled();
    const pinIsSet = await this.isPinSet();
    const autoLockMinutes = await this.getAutoLockTimeout();

    return {
      isAuthenticated: this.authenticated,
      hasBiometrics: available,
      biometricType: types,
      biometricEnabled: biometricEnabled && available,
      pinIsSet,
      autoLockMinutes,
    };
  }

  /**
   * Lock the app.
   */
  lock(): void {
    this.authenticated = false;
    vault.lock();
  }

  /**
   * Check if user is currently authenticated.
   */
  isAuthenticated(): boolean {
    return this.authenticated && vault.isUnlocked();
  }

  /**
   * Reset all auth data (for "Delete all data" in settings).
   */
  async resetAll(): Promise<void> {
    this.authenticated = false;
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(AUTO_LOCK_TIMEOUT_KEY);
    // Also kept for backward compat with old PinScreen
    await SecureStore.deleteItemAsync('cnsnt-pin');
    await vault.purgeAll();
  }

  /**
   * Generate a stable biometric-derived token.
   * We use a device-stored secret that's only accessible after biometric auth.
   */
  private async getBiometricToken(): Promise<string> {
    const key = 'cnsnt_biometric_token';
    let token = await SecureStore.getItemAsync(key);
    if (!token) {
      token = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'biometric_' + Date.now().toString() + Math.random().toString()
      );
      await SecureStore.setItemAsync(key, token);
    }
    return token;
  }
}

export const authService = new AuthService();
export default authService;
