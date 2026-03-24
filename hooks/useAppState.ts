/**
 * Hook to handle app state changes for auto-lock functionality.
 * Detects when app goes to background and triggers lock after timeout.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import vault from '../services/encryption';

interface UseAppStateOptions {
  onLock: () => void;
  enabled: boolean;
}

export function useAppState({ onLock, enabled }: UseAppStateOptions): void {
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // App going to background - record timestamp
          backgroundTimestamp.current = Date.now();
        }

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App coming to foreground - check if we should lock
          if (backgroundTimestamp.current) {
            const elapsed = Date.now() - backgroundTimestamp.current;
            // If vault has already auto-locked itself, trigger the UI lock
            if (!vault.isUnlocked()) {
              onLock();
            }
          }
          backgroundTimestamp.current = null;

          // Reset vault activity timer
          if (vault.isUnlocked()) {
            vault.resetActivity();
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [onLock, enabled]);
}

export default useAppState;
