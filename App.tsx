/**
 * cnsnt - Secure Consent Management App
 *
 * Root component:
 * - Animated splash screen
 * - Onboarding flow (first launch)
 * - Authentication gate (biometric + PIN)
 * - Auto-lock on inactivity
 * - Tab navigation with proper icons
 * - Stack navigation for all screens
 * - Error boundaries on all screens
 * - RevenueCat initialization
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LockScreen from './screens/LockScreen';
import {
  HomeScreen,
  Dashboard,
  Settings,
  RecordingScreen,
  ConsentBuilderScreen,
  NdaScreen,
  WaiverScreen,
  MutualReleaseScreen,
  SexualConsentScreen,
  TemplateForm,
  PDFPreviewScreen,
} from './screens';
import { useAppState } from './hooks/useAppState';
import purchaseService from './services/purchases';
import vault from './services/encryption';
import { Colors, Typography, Shadows, MIN_TOUCH_SIZE, Assets } from './constants/theme';
import type { RootStackParamList } from './types';

const ONBOARDING_COMPLETE_KEY = 'cnsnt_onboarding_complete';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Tab bar icon component using Ionicons.
 * NutriAI polish: Ionicons for crisp vector tab icons.
 */
function TabBarIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const iconMap: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    Forms: { active: 'document-text', inactive: 'document-text-outline' },
    Records: { active: 'folder', inactive: 'folder-outline' },
    Settings: { active: 'settings', inactive: 'settings-outline' },
  };

  const icons = iconMap[routeName] || iconMap.Forms;
  const iconName = focused ? icons.active : icons.inactive;

  return (
    <View style={tabStyles.iconWrapper}>
      <Ionicons
        name={iconName}
        size={focused ? 24 : 22}
        color={focused ? Colors.primary : Colors.tabBarInactive}
      />
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  indicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
});

/**
 * Main tab navigator with Forms, Records, and Settings.
 */
function MainTabs({ onLock }: { onLock: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...Shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: -2,
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTitleStyle: {
          ...Typography.h3,
          color: Colors.textPrimary,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Forms"
        component={HomeScreen}
        options={{ title: 'Templates' }}
      />
      <Tab.Screen
        name="Records"
        component={Dashboard}
        options={{ title: 'Records' }}
      />
      <Tab.Screen name="Settings">
        {(props) => <Settings {...props} onLock={onLock} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/**
 * App states:
 * 1. splash - animated splash screen
 * 2. onboarding - first-time user flow
 * 3. locked - authentication required
 * 4. unlocked - main app
 */
type AppPhase = 'splash' | 'onboarding' | 'locked' | 'unlocked';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('splash');

  const handleSplashComplete = useCallback(async () => {
    const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (onboardingDone === 'true') {
      setPhase('locked');
    } else {
      setPhase('onboarding');
    }
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setPhase('locked');
  }, []);

  const handleUnlock = useCallback(() => {
    setPhase('unlocked');
  }, []);

  const handleLock = useCallback(() => {
    setPhase('locked');
  }, []);

  useAppState({
    onLock: handleLock,
    enabled: phase === 'unlocked',
  });

  useEffect(() => {
    vault.onAutoLock(() => {
      handleLock();
    });
  }, [handleLock]);

  useEffect(() => {
    purchaseService.initialize();
  }, []);

  // Phase 1: Splash
  if (phase === 'splash') {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <SplashScreen onComplete={handleSplashComplete} />
          <StatusBar style="dark" />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  // Phase 2: Onboarding
  if (phase === 'onboarding') {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
          <StatusBar style="dark" />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  // Phase 3: Locked
  if (phase === 'locked') {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <LockScreen onUnlock={handleUnlock} />
          <StatusBar style="dark" />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  // Phase 4: Unlocked - Main App
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: Colors.surface },
              headerTitleStyle: {
                ...Typography.h3,
                color: Colors.textPrimary,
              },
              headerShadowVisible: false,
              headerTintColor: Colors.primary,
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
            >
              {() => <MainTabs onLock={handleLock} />}
            </Stack.Screen>
            <Stack.Screen
              name="ConsentBuilder"
              component={ConsentBuilderScreen}
              options={({ route }) => ({
                title: route.params?.title || 'Consent Builder',
              })}
            />
            <Stack.Screen
              name="Recording"
              component={RecordingScreen as React.ComponentType<any>}
              options={{ title: 'Audio Recording' }}
            />
            <Stack.Screen
              name="NDA"
              component={NdaScreen}
              options={{ title: 'Non-Disclosure Agreement' }}
            />
            <Stack.Screen
              name="SexualConsent"
              component={SexualConsentScreen}
              options={{ title: 'Sexual Consent Agreement' }}
            />
            <Stack.Screen
              name="Waiver"
              component={WaiverScreen}
              options={{ title: 'Liability Waiver' }}
            />
            <Stack.Screen
              name="MutualRelease"
              component={MutualReleaseScreen}
              options={{ title: 'Mutual Release of Claims' }}
            />
            <Stack.Screen
              name="TemplateForm"
              component={TemplateForm as React.ComponentType<any>}
              options={{ title: 'New Consent Record' }}
            />
            <Stack.Screen
              name="PDFPreview"
              component={PDFPreviewScreen as React.ComponentType<any>}
              options={{ title: 'Document Preview' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
