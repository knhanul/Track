import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { listLifeRecords } from '../database/recordRepository';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatSyncStatus,
} from '../domain/format';
import type { LifeRecordSummary } from '../domain/models';
import { colors, radius, spacing, typography } from '../theme';

export function HistoryScreen() {
  const [records, setRecords] = useState<LifeRecordSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRecords(await listLifeRecords());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
      }
    >
      <Text style={styles.eyebrow}>MEMORY</Text>
      <Text style={styles.title}>나의 기록</Text>
      <Text style={styles.description}>
        산책이나 라이딩 같은 종목보다, 그날의 이동과 시간을 중심으로 봅니다.
      </Text>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 기록이 없습니다.</Text>
          <Text style={styles.emptyText}>첫 일상 기록을 시작해 보세요.</Text>
        </View>
      ) : (
        records.map((record) => (
          <View key={record.recordId} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{record.title}</Text>
                <Text style={styles.date}>
                  {new Date(record.startedAtMs).toLocaleString('ko-KR')}
                </Text>
              </View>
              <Text style={styles.sync}>
                {formatSyncStatus(record.syncStatus)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.metric}>
                {formatDistance(record.distanceM)}km
              </Text>
              <Text style={styles.metric}>{formatDuration(record.elapsedMs)}</Text>
              <Text style={styles.metric}>
                상승 {formatElevation(record.elevationGainM)}m
              </Text>
            </View>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {},
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  empty: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  sync: {
    ...typography.caption,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metric: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
