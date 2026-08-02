import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { listActivityRecords } from '../database/recordRepository';
import { groupRecordsByLocalDate } from '../domain/historyGrouping';
import type { ActivityRecordSummary } from '../domain/models';
import { ActivityPeriodSelector } from '../features/history/components/ActivityPeriodSelector';
import { ActivityPeriodSummaryCard } from '../features/history/components/ActivityPeriodSummaryCard';
import { ActivityTypeFilter } from '../features/history/components/ActivityTypeFilter';
import { HistoryEmptyState } from '../features/history/components/HistoryEmptyState';
import { HistoryRecordCard } from '../features/history/components/HistoryRecordCard';
import {
  type ActivityHistoryPeriod,
  filterRecordsByPeriod,
} from '../features/history/historyPeriod';
import {
  type ActivityHistoryTypeFilter,
  filterRecordsByActivityType,
  hasUnknownRecords,
  summarizeActivityRecords,
} from '../features/history/historySummary';
import { colors, spacing, typography } from '../theme';

interface HistorySection {
  dateKey: string;
  label: string;
  count: number;
  data: ActivityRecordSummary[];
}

export function HistoryScreen() {
  const [allRecords, setAllRecords] = useState<ActivityRecordSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ActivityHistoryPeriod>('week');
  const [selectedType, setSelectedType] = useState<ActivityHistoryTypeFilter>('all');

  const showUnknownFilter = useMemo(() => hasUnknownRecords(allRecords), [allRecords]);

  const periodRecords = useMemo(
    () => filterRecordsByPeriod(allRecords, selectedPeriod),
    [allRecords, selectedPeriod],
  );

  const filteredRecords = useMemo(
    () => filterRecordsByActivityType(periodRecords, selectedType),
    [periodRecords, selectedType],
  );

  const summary = useMemo(
    () => summarizeActivityRecords(filteredRecords),
    [filteredRecords],
  );

  const sections = useMemo<HistorySection[]>(() => {
    return groupRecordsByLocalDate(filteredRecords).map((group) => ({
      dateKey: group.dateKey,
      label: group.label,
      count: group.records.length,
      data: group.records,
    }));
  }, [filteredRecords]);

  const load = useCallback(async () => {
    setAllRecords(await listActivityRecords());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const listHeader = (
    <View style={styles.screenHeaderWrap}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.title}>활동 기록</Text>
        <Text style={styles.totalCount}>{allRecords.length}개</Text>
      </View>
      <Text style={styles.description}>자전거, 산책, 러닝과 등산 기록을 날짜별로 확인해요.</Text>

      <View style={styles.periodSelectorWrap}>
        <ActivityPeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </View>

      <View style={styles.summaryCardWrap}>
        <ActivityPeriodSummaryCard
          activityCount={summary.activityCount}
          totalDistanceM={summary.totalDistanceM}
          totalMovingMs={summary.totalMovingMs}
          totalElevationGainM={summary.totalElevationGainM}
        />
      </View>

      <View style={styles.typeFilterWrap}>
        <ActivityTypeFilter
          value={selectedType}
          onChange={setSelectedType}
          showUnknown={showUnknownFilter}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer includeBottomTabSpace>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.recordId}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <HistoryEmptyState hasRecords={allRecords.length > 0} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={styles.groupHeader}
            accessibilityLabel={`${section.label}, 활동 ${section.count}개`}
          >
            <Text style={styles.groupTitle}>{section.label}</Text>
            <Text style={styles.groupCount}>{section.count}개</Text>
          </View>
        )}
        renderItem={({ item }) => <HistoryRecordCard record={item} />}
        SectionSeparatorComponent={() => <View style={styles.groupSeparator} />}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        contentContainerStyle={[styles.listContent, filteredRecords.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  screenHeaderWrap: {
    marginBottom: spacing.lg,
  },
  periodSelectorWrap: {
    marginTop: spacing.md,
  },
  summaryCardWrap: {
    marginTop: spacing.sm,
  },
  typeFilterWrap: {
    marginTop: spacing.md,
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  totalCount: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  groupCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  groupSeparator: {
    height: spacing.xl,
  },
  cardSeparator: {
    height: spacing.sm,
  },
});
