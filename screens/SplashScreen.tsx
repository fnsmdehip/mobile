/**
 * Animated Splash Screen
 * Uses custom logo_fullcolor.png and icon_shield.png assets.
 * Fades in logo with shield animation, then transitions out.
 * Uses Animated API for smooth 60fps performance.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Typography, Assets } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shieldScale = useRef(new Animated.Value(0)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Shield icon appears
      Animated.parallel([
        Animated.spring(shieldScale, {
          toValue: 1,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shieldOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Logo text fades in with scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 14,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // Phase 4: Security badge fades in
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Phase 5: Hold, then fade out
      Animated.delay(500),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [
    logoScale, logoOpacity, shieldScale, shieldOpacity,
    taglineOpacity, taglineTranslateY, containerOpacity,
    badgeOpacity, onComplete,
  ]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        {/* Shield icon from custom asset */}
        <Animated.View
          style={[
            styles.shieldContainer,
            {
              opacity: shieldOpacity,
              transform: [{ scale: shieldScale }],
            },
          ]}
        >
          <Image
            source={Assets.iconShield}
            style={styles.shieldImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name using logo text asset */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.appName}>cnsnt</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          }}
        >
          <Text style={styles.tagline}>Secure digital consent management</Text>
        </Animated.View>
      </View>

      {/* Security badge at footer */}
      <Animated.View style={[styles.footer, { opacity: badgeOpacity }]}>
        <View style={styles.securityBadge}>
          <Image
            source={Assets.iconCloudLock}
            style={styles.badgeIcon}
            resizeMode="contain"
          />
          <Text style={styles.securityText}>AES-256 Encrypted</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContainer: {
    marginBottom: 20,
  },
  shieldImage: {
    width: 88,
    height: 88,
  },
  logoContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  securityText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});

export default SplashScreen;
