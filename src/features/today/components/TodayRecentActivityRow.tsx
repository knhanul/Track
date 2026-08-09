import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Route } from 'lucide-react-native';

import { formatActivityType } from '../../../domain/activityType';
import {
  formatCompactDuration,
  formatDistance,
  formatLocalTime,
  formatSyncStatus,
} from '../../../domain/format';
import type { ActivityRecordSummary } from '../../../domain/models';
import { colors, radius, spacing, typography } from '../../../theme';

interface TodayRecentActivityRowProps {
  record: ActivityRecordSummary;
  onPress?: () => void;
}

export function TodayRecentActivityRow({ record, onPress }: TodayRecentActivityRowProps) {
  const activityLabel = formatActivityType(record.activityType);
  const syncLabel = formatSyncStatus(record.syncStatus);
  const syncColor = getSyncColor(record.syncStatus);

  const accessibilityLabel = `${activityLabel}, ${record.title}, 거리 ${formatDistance(record.distanceM)}킬로미터, 활동 시간 ${formatCompactDuration(record.movingMs)}, ${formatLocalTime(record.startedAtMs)} 시작, ${syncLabel}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {`${activityLabel} · ${record.title}`}
        </Text>
        <Text style={[styles.syncBadge, { color: syncColor }]} numberOfLines={1}>
          {syncLabel}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.meta} numberOfLines={1}>
          {`${formatDistance(record.distanceM)}km · ${formatCompactDuration(record.movingMs)} · ${formatLocalTime(record.startedAtMs)}`}
        </Text>
        <ChevronRight size={16} color={colors.textMuted} accessible={false} />
      </View>
    </Pressable>
  );
}

function getSyncColor(status: ActivityRecordSummary['syncStatus']): string {
  switch (status) {
    case 'pending':
    case 'pending_create':
    case 'pending_update':
    case 'pending_delete':
      return colors.warning;
    case 'syncing':
      return colors.primary;
    case 'synced':
      return colors.success;
    case 'failed':
    case 'sync_error':
      return colors.danger;
    case 'local_only':
    default:
      return colors.textSecondary;
  }
}

export function TodayRecentActivityEmpty() {
  return (
    <View style={styles.emptyContainer}>
      <Route size={20} color={colors.textMuted} accessible={false} />
      <View style={styles.emptyTextWrap}>
        <Text style={styles.emptyTitle}>아직 오늘의 활동이 없어요.</Text>
        <Text style={styles.emptySub}>첫 활동을 기록해 보세요.</Text>
      </View>
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
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.75,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  syncBadge: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    flexShrink: 1,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emptyTextWrap: {
    flex: 1,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  emptySub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
