import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Activity,
  Bike,
  Footprints,
  Mountain,
  Route,
  type LucideIcon,
} from 'lucide-react-native';

import { SyncStatusBadge } from '../../../components/SyncStatusBadge';
import { formatActivityType, type ActivityType } from '../../../domain/activityType';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatLocalTime,
  formatPaceFromSpeedKph,
  formatRestDuration,
  formatSpeed,
  formatSyncStatus,
} from '../../../domain/format';
import type { ActivityRecordSummary } from '../../../domain/models';
import { colors, radius, spacing, typography } from '../../../theme';

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  cycling: Bike,
  walking: Footprints,
  running: Activity,
  hiking: Mountain,
  trail_running: Route,
  unknown: Route,
};

interface HistoryRecordCardProps {
  record: ActivityRecordSummary;
}

function getDisplayMovingMs(record: ActivityRecordSummary): number {
  if (record.movingMs != null && Number.isFinite(record.movingMs) && record.movingMs > 0) {
    return record.movingMs;
  }
  if (record.elapsedMs != null && Number.isFinite(record.elapsedMs) && record.elapsedMs > 0) {
    return record.elapsedMs;
  }
  return 0;
}

export function HistoryRecordCard({ record }: HistoryRecordCardProps) {
  const distanceText = formatDistance(record.distanceM);
  const movingMs = getDisplayMovingMs(record);
  const movingText = formatDuration(movingMs);
  const totalText = formatDuration(record.elapsedMs);
  const elevationText = formatElevation(record.elevationGainM);
  const timeText = formatLocalTime(record.startedAtMs);

  const isPaceActivity =
    record.activityType === 'running' || record.activityType === 'trail_running';
  const speedLabel = isPaceActivity ? '평균 페이스' : '평균 속도';
  const speedValue = isPaceActivity
    ? formatPaceFromSpeedKph(record.averageSpeedKph)
    : `${formatSpeed(record.averageSpeedKph)}km/h`;

  const restMs = record.elapsedMs - movingMs;
  const showRest = restMs >= 60000;
  const restText = showRest ? formatRestDuration(restMs) : '';

  const Icon = ACTIVITY_ICONS[record.activityType];

  const a11yParts = [
    formatActivityType(record.activityType),
    record.title,
    `${timeText} 시작`,
    `거리 ${distanceText}킬로미터`,
    `활동 시간 ${movingText}`,
    `${speedLabel} ${speedValue}`,
    `상승 ${elevationText}미터`,
  ];
  if (showRest) {
    a11yParts.push(`전체 시간 ${totalText}, 휴식 ${restText}`);
  }
  a11yParts.push(formatSyncStatus(record.syncStatus));

  return (
    <View style={styles.card} accessibilityLabel={a11yParts.join(', ')}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Icon size={16} color={colors.primary} accessible={false} />
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
            {`${formatActivityType(record.activityType)} · ${record.title}`}
          </Text>
        </View>
        <View style={styles.statusWrap}>
          <SyncStatusBadge status={record.syncStatus} compact />
        </View>
      </View>

      <Text style={styles.time}>{timeText}</Text>

      <View style={styles.metricRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{distanceText}</Text>
          <Text style={styles.metricLabel}>거리</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{movingText}</Text>
          <Text style={styles.metricLabel}>활동 시간</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{speedValue}</Text>
          <Text style={styles.metricLabel}>{speedLabel}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{elevationText}</Text>
          <Text style={styles.metricLabel}>상승</Text>
        </View>
      </View>

      {showRest ? (
        <Text style={styles.restLine}>
          전체 {totalText} · 휴식 {restText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    flexShrink: 1,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  statusWrap: {
    flexShrink: 0,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  metricItem: {
    flexGrow: 1,
    flexBasis: '23%',
    minWidth: 72,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: colors.textMuted,
    marginTop: 1,
  },
  restLine: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xxs,
  },
});
