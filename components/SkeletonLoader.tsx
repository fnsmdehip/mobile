/**
 * Skeleton loading placeholders for professional loading states.
 * Animated shimmer effect for premium feel.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonItem: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <SkeletonItem width={48} height={48} borderRadius={14} />
      <View style={styles.cardHeaderText}>
        <SkeletonItem width="70%" height={18} />
        <SkeletonItem width="50%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
    <SkeletonItem width="90%" height={14} style={{ marginTop: 12 }} />
    <SkeletonItem width="60%" height={14} style={{ marginTop: 8 }} />
  </View>
);

export const SkeletonStatsRow: React.FC = () => (
  <View style={styles.statsRow}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.statItem}>
        <SkeletonItem width={48} height={32} borderRadius={8} />
        <SkeletonItem width={40} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    ))}
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.list}>
    <SkeletonStatsRow />
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    paddingTop: Spacing.md,
  },
});
