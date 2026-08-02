import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCompactDuration, formatDistance, formatElevation } from '../../../domain/format';
import { colors, radius, spacing, typography } from '../../../theme';

interface TodayHeroSummaryCardProps {
  distanceM: number;
  activityCount: number;
  movingMs: number;
  elevationGainM: number;
}

export function TodayHeroSummaryCard({
  distanceM,
  activityCount,
  movingMs,
  elevationGainM,
}: TodayHeroSummaryCardProps) {
  const distanceText = formatDistance(distanceM);
  const movingText = formatCompactDuration(movingMs);
  const elevationText = formatElevation(elevationGainM);

  const accessibilityLabel = `오늘 기록, 총 거리 ${distanceText}킬로미터, 활동 ${activityCount}회, 활동 시간 ${movingText}, 상승 ${elevationText}미터`;

  return (
    <View style={styles.card} accessibilityLabel={accessibilityLabel}>
      <View style={styles.topRow}>
        <Text style={styles.label}>오늘 기록</Text>
        <Text style={styles.count}>활동 {activityCount}회</Text>
      </View>

      <View style={styles.distanceRow}>
        <Text style={styles.distance} numberOfLines={1}>{distanceText}</Text>
        <Text style={styles.unit}>km</Text>
      </View>

      <Text style={styles.subLine} numberOfLines={1}>
        {`${movingText} 활동 · 상승 ${elevationText}m`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  distance: {
    ...typography.metricMedium,
    fontSize: 32,
    lineHeight: 38,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  subLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
