import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatElevation,
  formatSummaryDistance,
  formatSummaryDuration,
} from '../../../domain/format';
import { colors, radius, spacing, typography } from '../../../theme';

interface ActivityPeriodSummaryCardProps {
  activityCount: number;
  totalDistanceM: number;
  totalMovingMs: number;
  totalElevationGainM: number;
}

export function ActivityPeriodSummaryCard({
  activityCount,
  totalDistanceM,
  totalMovingMs,
  totalElevationGainM,
}: ActivityPeriodSummaryCardProps) {
  const distanceText = formatSummaryDistance(totalDistanceM);
  const durationText = formatSummaryDuration(totalMovingMs);
  const elevationText = formatElevation(totalElevationGainM);

  return (
    <View
      style={styles.card}
      accessibilityLabel={`선택 기간 활동 요약, 활동 횟수 ${activityCount}회, 총 거리 ${distanceText}킬로미터, 활동 시간 ${durationText}, 올라간 높이 ${elevationText}미터`}
    >
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.label}>활동 횟수</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{activityCount}</Text>
            <Text style={styles.unit}>회</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>총 거리</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{distanceText}</Text>
            <Text style={styles.unit}>km</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>활동 시간</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{durationText}</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>올라간 높이</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{elevationText}</Text>
            <Text style={styles.unit}>m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  value: {
    ...typography.metricMedium,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
