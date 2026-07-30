import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CloudUpload, Route } from 'lucide-react-native';

import { ActionButton } from '../components/ActionButton';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { getTodaySummary, type TodaySummary } from '../database/recordRepository';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatKoreanLocalDate,
  formatLocalTime,
} from '../domain/format';
import { buildTodaySummaryText } from '../domain/todaySummaryText';
import type { RecorderController } from '../domain/models';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
  onOpenRecord(): void;
  refreshSignal?: number;
}

const EMPTY_SUMMARY: TodaySummary = {
  dateKey: '',
  recordCount: 0,
  totalDistanceM: 0,
  totalElapsedMs: 0,
  totalMovingMs: 0,
  totalRestMs: 0,
  totalElevationGainM: 0,
  pendingSyncCount: 0,
  recentRecords: [],
};

export function TodayScreen({ onOpenRecord, refreshSignal = 0 }: Props) {
  const [summary, setSummary] = useState<TodaySummary>(EMPTY_SUMMARY);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummary(await getTodaySummary());
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshSignal]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadSummary();
      }
    });
    return () => subscription.remove();
  }, [loadSummary]);

  const dateText = useMemo(() => formatKoreanLocalDate(new Date()), [summary.dateKey]);
  const summaryText = useMemo(() => buildTodaySummaryText(summary), [summary]);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadSummary();
    } finally {
      setRefreshing(false);
    }
  }

  const pendingSyncText =
    summary.pendingSyncCount === 1
      ? '클라우드 업로드를 기다리는 기록이 1개 있어요.'
      : `클라우드 업로드를 기다리는 기록이 ${summary.pendingSyncCount}개 있어요.`;

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
      }
    >
      <Text style={styles.date}>{dateText}</Text>
      <Text style={styles.title}>오늘의 움직임</Text>

      <View
        style={styles.heroCard}
        accessibilityLabel={`오늘 이동 거리 ${formatDistance(summary.totalDistanceM)}킬로미터`}
      >
        <Text style={styles.heroLabel}>오늘의 이동</Text>

        <View style={styles.heroMetricRow}>
          <Text style={styles.heroDistance}>{formatDistance(summary.totalDistanceM)}</Text>
          <Text style={styles.heroUnit}>km</Text>
        </View>

        <Text style={styles.summaryPrimary}>{summaryText.primary}</Text>
        {summaryText.secondary ? (
          <Text style={styles.summarySecondary}>{summaryText.secondary}</Text>
        ) : null}
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          label="움직인 시간"
          value={formatDuration(summary.totalMovingMs)}
          accessibilityLabel={`움직인 시간 ${formatDuration(summary.totalMovingMs)}`}
        />
        <MetricCard
          label="머문 시간"
          value={formatDuration(summary.totalRestMs)}
          accessibilityLabel={`머문 시간 ${formatDuration(summary.totalRestMs)}`}
        />
        <MetricCard
          label="올라간 높이"
          value={`${formatElevation(summary.totalElevationGainM)}m`}
          accessibilityLabel={`올라간 높이 ${formatElevation(summary.totalElevationGainM)}미터`}
        />
        <MetricCard
          label="오늘 기록"
          value={`${summary.recordCount}개`}
          accessibilityLabel={`오늘 기록 ${summary.recordCount}개`}
        />
      </View>

      {summary.pendingSyncCount > 0 ? (
        <View style={styles.pendingBanner}>
          <CloudUpload size={18} color={colors.primary} />
          <Text style={styles.pendingText}>{pendingSyncText}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 기록</Text>
        <Text style={styles.sectionCount}>{summary.recordCount}개</Text>
      </View>

      {summary.recentRecords.length === 0 ? (
        <View style={styles.emptyCard}>
          <Route size={24} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>아직 오늘의 기록이 없습니다.</Text>
          <Text style={styles.emptyText}>기록 버튼을 눌러 첫 움직임을 남겨 보세요.</Text>
        </View>
      ) : (
        summary.recentRecords.map((record) => (
          <View key={record.recordId} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text numberOfLines={1} style={styles.recordTitle}>
                {record.title}
              </Text>
              <SyncStatusBadge status={record.syncStatus} compact />
            </View>

            <Text style={styles.recordTime}>{formatLocalTime(record.startedAtMs)}</Text>

            <View style={styles.recordMetrics}>
              <Text style={styles.metricText}>{formatDistance(record.distanceM)}km</Text>
              <Text style={styles.metricText}>{formatDuration(record.elapsedMs)}</Text>
              <Text style={styles.metricText}>상승 {formatElevation(record.elevationGainM)}m</Text>
            </View>
          </View>
        ))
      )}

      <ActionButton
        label="일상 기록 시작"
        onPress={onOpenRecord}
        style={styles.startButton}
      />
    </ScreenContainer>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  accessibilityLabel: string;
}

function MetricCard({ label, value, accessibilityLabel }: MetricCardProps) {
  return (
    <View style={styles.metricCard} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  heroCard: {
    marginTop: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  heroMetricRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  heroDistance: {
    ...typography.metricHero,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryPrimary: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  summarySecondary: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 90,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricValue: {
    ...typography.metricMedium,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
    fontVariant: ['tabular-nums'],
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pendingText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionHeader: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recordCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xxs,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recordTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  recordTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  recordMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  startButton: {
    marginTop: spacing.sm,
  },
});
