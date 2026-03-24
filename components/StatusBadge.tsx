/**
 * Status badge component for displaying consent record status.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConsentStatus } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface StatusBadgeProps {
  status: ConsentStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<
  ConsentStatus,
  { label: string; bg: string; text: string }
> = {
  active: { label: 'Active', bg: '#E8F5E9', text: '#2E7D32' },
  expired: { label: 'Expired', bg: '#FFF3E0', text: '#E65100' },
  revoked: { label: 'Revoked', bg: '#FFEBEE', text: '#C62828' },
  draft: { label: 'Draft', bg: '#F5F5F5', text: '#757575' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    ...Typography.label,
    fontWeight: '600',
  },
  textSmall: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

export default StatusBadge;
