import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import type { TabKey } from '../components/BottomTabs';
import { getTodaySummary, type TodaySummary } from '../database/recordRepository';
import { formatKoreanLocalDate } from '../domain/format';
import type { ActivityRecordSummary, RecorderController } from '../domain/models';
import { TodayHeroSummaryCard } from '../features/today/components/TodayHeroSummaryCard';
import { TodayCompactMetrics } from '../features/today/components/TodayCompactMetrics';
import { TodaySyncStatusRow } from '../features/today/components/TodaySyncStatusRow';
import {
  TodayRecentActivityRow,
  TodayRecentActivityEmpty,
} from '../features/today/components/TodayRecentActivityRow';
import { BOTTOM_TAB_BASE_HEIGHT } from '../constants/layout';
import { colors, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
  onOpenRecord(): void;
  onSelectTab(tab: TabKey): void;
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

const CTA_HEIGHT = 56;
const CTA_MARGIN_TOP = spacing.md;
const CTA_MARGIN_BOTTOM = spacing.sm;

export function TodayScreen({ onOpenRecord, onSelectTab, refreshSignal = 0 }: Props) {
  const insets = useSafeAreaInsets();
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

  const latestRecord = useMemo<ActivityRecordSummary | null>(() => {
    if (summary.recentRecords.length === 0) return null;
    const sorted = [...summary.recentRecords].sort((a, b) => b.startedAtMs - a.startedAtMs);
    return sorted[0] ?? null;
  }, [summary.recentRecords]);

  const remainingCount = summary.recordCount > 1 ? summary.recordCount - 1 : 0;

  async function refresh() {
    setRefreshing(true);
    try {
      await loadSummary();
    } finally {
      setRefreshing(false);
    }
  }

  const scrollPaddingBottom =
    CTA_HEIGHT + CTA_MARGIN_TOP + CTA_MARGIN_BOTTOM +
    BOTTOM_TAB_BASE_HEIGHT + insets.bottom + spacing.sm;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: scrollPaddingBottom },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <Text style={styles.date}>{dateText}</Text>
        <Text style={styles.title}>오늘의 활동</Text>

        <TodayHeroSummaryCard
          distanceM={summary.totalDistanceM}
          activityCount={summary.recordCount}
          movingMs={summary.totalMovingMs}
          elevationGainM={summary.totalElevationGainM}
        />

        <TodayCompactMetrics
          movingMs={summary.totalMovingMs}
          restMs={summary.totalRestMs}
          elevationGainM={summary.totalElevationGainM}
        />

        <TodaySyncStatusRow pendingSyncCount={summary.pendingSyncCount} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          <View style={styles.sectionRight}>
            {summary.recordCount > 0 ? (
              <Pressable
                onPress={() => onSelectTab('history')}
                accessibilityRole="button"
                accessibilityLabel="전체 보기, 활동 탭으로 이동"
              >
                <Text style={styles.viewAllText}>전체 보기</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {latestRecord ? (
          <>
            <TodayRecentActivityRow
              record={latestRecord}
              onPress={() => onSelectTab('history')}
            />
            {remainingCount > 0 ? (
              <Text style={styles.remainingText}>
                외 {remainingCount}개의 활동 기록이 있어요.
              </Text>
            ) : null}
          </>
        ) : (
          <TodayRecentActivityEmpty />
        )}
      </ScrollView>

      <View
        style={[
          styles.ctaContainer,
          { bottom: BOTTOM_TAB_BASE_HEIGHT + insets.bottom },
        ]}
      >
        <ActionButton
          label="활동 기록 시작"
          onPress={onOpenRecord}
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.primary,
  },
  remainingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
    marginLeft: spacing.xxs,
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  ctaButton: {
    minHeight: CTA_HEIGHT,
  },
});
