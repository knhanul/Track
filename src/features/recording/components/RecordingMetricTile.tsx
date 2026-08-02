import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

interface RecordingMetricTileProps {
  label: string;
  value: string;
  unit?: string;
  emphasis?: 'primary' | 'secondary';
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export function RecordingMetricTile({
  label,
  value,
  unit,
  emphasis = 'secondary',
  fullWidth = false,
  accessibilityLabel,
}: RecordingMetricTileProps) {
  return (
    <View
      style={[styles.card, fullWidth && styles.fullWidth, emphasis === 'primary' && styles.primaryCard]}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={[styles.value, emphasis === 'primary' && styles.primaryValue]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 96,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  primaryCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  valueLine: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    ...typography.metricMedium,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  primaryValue: {
    ...typography.metricMedium,
  },
  unit: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});
