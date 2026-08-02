import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatActivityType, type ActivityType } from '../../../domain/activityType';
import type { LiveMetrics } from '../../../domain/models';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPaceFromSpeedKph,
  formatSpeed,
} from '../../../domain/format';
import { colors, radius, spacing, typography } from '../../../theme';
import { CompactMetricCell } from './CompactMetricCell';
import { RecordingStorageStatusRow } from './RecordingStorageStatusRow';

interface CompactRecordingDashboardProps {
  metrics: LiveMetrics;
  compactHeight: boolean;
}

export function CompactRecordingDashboard({ metrics, compactHeight }: CompactRecordingDashboardProps) {
  const usePace = metrics.activityType === 'running' || metrics.activityType === 'trail_running';
  const gpsUnavailable =
    metrics.recordingGpsState === 'waiting_for_usable_fix' ||
    metrics.recordingGpsState === 'temporarily_degraded';

  const currentLabel = usePace ? '현재 페이스' : '현재 속도';
  const currentValue = gpsUnavailable
    ? '--'
    : usePace
      ? formatPaceFromSpeedKph(metrics.currentSpeedKph)
      : formatSpeed(metrics.currentSpeedKph);
  const currentUnit = usePace ? '' : 'km/h';

  const avgLabel = usePace ? '평균 페이스' : '평균 속도';
  const avgValue = usePace
    ? formatPaceFromSpeedKph(metrics.averageSpeedKph)
    : formatSpeed(metrics.averageSpeedKph);
  const avgUnit = usePace ? '' : 'km/h';

  const activityLabel = formatActivityType(metrics.activityType);

  const summaryLabel =
    `${activityLabel} 기록 중, ` +
    `현재 ${usePace ? '페이스' : '속도'} ${gpsUnavailable ? '대기 중' : `${currentValue}${currentUnit}`}, ` +
    `활동 거리 ${formatDistance(metrics.distanceM)}킬로미터, ` +
    `활동 시간 ${formatDuration(metrics.movingMs)}, ` +
    `전체 시간 ${formatDuration(metrics.elapsedMs)}, ` +
    `휴식 시간 ${formatDuration(metrics.restMs)}, ` +
    `평균 ${usePace ? '페이스' : '속도'} ${avgValue}${avgUnit}, ` +
    `최고 속도 ${formatSpeed(metrics.maxSpeedKph)}킬로미터 매시, ` +
    `올라간 높이 ${formatElevation(metrics.elevationGainM)}미터, ` +
    `GPS 포인트 ${metrics.pointCount}개`;

  return (
    <View
      style={[styles.container, compactHeight && styles.containerCompact]}
      accessibilityLabel={summaryLabel}
    >
      <View style={styles.primaryRow}>
        <View style={styles.primaryLeft}>
          <Text style={styles.primaryLabel}>{currentLabel}</Text>
          <View style={styles.primaryValueRow}>
            <Text style={styles.primaryValue}>{currentValue}</Text>
            {currentUnit ? <Text style={styles.primaryUnit}>{currentUnit}</Text> : null}
          </View>
        </View>
        <View style={styles.primaryRight}>
          <Text style={styles.primaryLabel}>활동 거리</Text>
          <View style={styles.primaryValueRow}>
            <Text style={styles.primaryValue}>{formatDistance(metrics.distanceM)}</Text>
            <Text style={styles.primaryUnit}>km</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.gridRow}>
        <CompactMetricCell
          label="활동 시간"
          value={formatDuration(metrics.movingMs)}
          accessibilityLabel={`활동 시간 ${formatDuration(metrics.movingMs)}`}
        />
        <CompactMetricCell
          label="전체 시간"
          value={formatDuration(metrics.elapsedMs)}
          accessibilityLabel={`전체 시간 ${formatDuration(metrics.elapsedMs)}`}
        />
        <CompactMetricCell
          label="휴식 시간"
          value={formatDuration(metrics.restMs)}
          accessibilityLabel={`휴식 시간 ${formatDuration(metrics.restMs)}`}
        />
      </View>

      <View style={styles.gridRow}>
        <CompactMetricCell
          label={avgLabel}
          value={avgValue}
          unit={avgUnit}
          accessibilityLabel={`평균 ${usePace ? '페이스' : '속도'} ${avgValue}${avgUnit}`}
        />
        <CompactMetricCell
          label="최고 속도"
          value={formatSpeed(metrics.maxSpeedKph)}
          unit="km/h"
          accessibilityLabel={`최고 속도 ${formatSpeed(metrics.maxSpeedKph)}킬로미터 매시`}
        />
        <CompactMetricCell
          label="고도 상승"
          value={formatElevation(metrics.elevationGainM)}
          unit="m"
          accessibilityLabel={`올라간 높이 ${formatElevation(metrics.elevationGainM)}미터`}
        />
      </View>

      <RecordingStorageStatusRow
        pointCount={metrics.pointCount}
        syncStatus={metrics.syncStatus}
        gpsState={metrics.recordingGpsState}
        paused={metrics.status === 'paused'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  containerCompact: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryLeft: {
    flex: 0.6,
    gap: spacing.xxs,
  },
  primaryRight: {
    flex: 0.4,
    gap: spacing.xxs,
  },
  primaryLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  primaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  primaryValue: {
    ...typography.metricMedium,
    fontSize: 27,
    lineHeight: 33,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  primaryUnit: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
