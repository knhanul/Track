import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCompactDuration, formatElevation } from '../../../domain/format';
import { colors, radius, spacing, typography } from '../../../theme';

interface TodayCompactMetricsProps {
  movingMs: number;
  restMs: number;
  elevationGainM: number;
}

export function TodayCompactMetrics({
  movingMs,
  restMs,
  elevationGainM,
}: TodayCompactMetricsProps) {
  const items = [
    {
      label: '활동 시간',
      value: formatCompactDuration(movingMs),
      a11y: `활동 시간 ${formatCompactDuration(movingMs)}`,
    },
    {
      label: '휴식 시간',
      value: formatCompactDuration(restMs),
      a11y: `휴식 시간 ${formatCompactDuration(restMs)}`,
    },
    {
      label: '올라간 높이',
      value: `${formatElevation(elevationGainM)}m`,
      a11y: `올라간 높이 ${formatElevation(elevationGainM)}미터`,
    },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View
          key={item.label}
          style={styles.tile}
          accessibilityLabel={item.a11y}
        >
          <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.value} numberOfLines={1}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.divider,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
