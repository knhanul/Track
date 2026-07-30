import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: string;
  unit?: string;
  prominent?: boolean;
}

export function MetricCard({ label, value, unit, prominent = false }: Props) {
  return (
    <View style={[styles.card, prominent && styles.prominent]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={[styles.value, prominent && styles.prominentValue]}>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prominent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryStrong,
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
  prominentValue: {
    ...typography.metricLarge,
    color: colors.primary,
  },
  unit: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});
