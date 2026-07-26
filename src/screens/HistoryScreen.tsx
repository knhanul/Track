import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listLifeRecords } from '../database/recordRepository';
import {
  formatDistance,
  formatDuration,
  formatElevation,
} from '../domain/format';
import type { LifeRecordSummary } from '../domain/models';

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
    <ScrollView
      contentContainerStyle={styles.container}
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
                {record.syncStatus === 'synced'
                  ? '클라우드 저장'
                  : record.syncStatus === 'pending'
                    ? '업로드 대기'
                    : '기기 저장'}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  eyebrow: {
    color: '#58E2D2',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 12,
  },
  title: {
    color: '#F5FAFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 10,
  },
  description: {
    color: '#91A4BA',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  empty: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#101E31',
  },
  emptyTitle: { color: '#F5FAFF', fontSize: 17, fontWeight: '800' },
  emptyText: { color: '#8195AC', marginTop: 8 },
  card: {
    marginBottom: 13,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#101E31',
    borderWidth: 1,
    borderColor: '#1A304A',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: '#EFF7FF', fontSize: 17, fontWeight: '800' },
  date: { color: '#7388A1', fontSize: 12, marginTop: 6 },
  sync: { color: '#58E2D2', fontSize: 11, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 17 },
  metric: { color: '#AFC0D3', fontSize: 13, fontWeight: '700' },
});
