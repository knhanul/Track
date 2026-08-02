import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

export type SettingsStatusTone = 'success' | 'warning' | 'danger' | 'neutral';

interface SettingsStatusBadgeProps {
  label: string;
  tone: SettingsStatusTone;
}

export function SettingsStatusBadge({ label, tone }: SettingsStatusBadgeProps) {
  const meta = getToneMeta(tone);

  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}>
      <Text numberOfLines={1} style={[styles.text, { color: meta.textColor }]}>
        {label}
      </Text>
    </View>
  );
}

function getToneMeta(tone: SettingsStatusTone): {
  textColor: string;
  backgroundColor: string;
} {
  switch (tone) {
    case 'success':
      return {
        textColor: colors.success,
        backgroundColor: colors.primarySoft,
      };
    case 'warning':
      return {
        textColor: colors.warning,
        backgroundColor: colors.warningSoft,
      };
    case 'danger':
      return {
        textColor: colors.danger,
        backgroundColor: colors.dangerSoft,
      };
    case 'neutral':
    default:
      return {
        textColor: colors.textSecondary,
        backgroundColor: colors.surfaceElevated,
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    maxWidth: 96,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
  },
});
