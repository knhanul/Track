import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../../theme';

interface CompactMetricCellProps {
  label: string;
  value: string;
  unit?: string;
  accessibilityLabel: string;
}

export function CompactMetricCell({ label, value, unit, accessibilityLabel }: CompactMetricCellProps) {
  return (
    <View style={styles.cell} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    gap: spacing.xxs,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
