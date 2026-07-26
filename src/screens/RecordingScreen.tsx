import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { MetricCard } from '../components/MetricCard';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatSpeed,
} from '../domain/format';
import type { RecorderController } from '../domain/models';

interface Props {
  recorder: RecorderController;
}

export function RecordingScreen({ recorder }: Props) {
  const metrics = recorder.metrics;
  const [momentOpen, setMomentOpen] = useState(false);
  const [momentText, setMomentText] = useState('');

  if (!metrics) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>기록 데이터를 불러오고 있어요.</Text>
      </View>
    );
  }

  const paused = metrics.status === 'paused';

  function confirmStop() {
    Alert.alert(
      '오늘의 기록을 마칠까요?',
      '기록은 기기에 저장되고 인터넷 연결 후 업로드 대기 상태가 됩니다.',
      [
        { text: '계속 기록', style: 'cancel' },
        {
          text: '기록 종료',
          style: 'destructive',
          onPress: () => void recorder.stop(),
        },
      ],
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>일상 기록 중</Text>
            <Text style={styles.headerTitle}>
              {paused ? '잠시 멈췄어요' : '지금의 움직임'}
            </Text>
          </View>
          <View style={[styles.liveBadge, paused && styles.pausedBadge]}>
            <View style={[styles.liveDot, paused && styles.pausedDot]} />
            <Text style={styles.liveText}>{paused ? 'PAUSED' : 'LIVE'}</Text>
          </View>
        </View>

        <MetricCard
          label="현재 속도"
          value={formatSpeed(metrics.currentSpeedKph)}
          unit="km/h"
          prominent
        />

        <View style={styles.grid}>
          <MetricCard
            label="이동 거리"
            value={formatDistance(metrics.distanceM)}
            unit="km"
          />
          <MetricCard label="전체 시간" value={formatDuration(metrics.elapsedMs)} />
          <MetricCard label="이동 시간" value={formatDuration(metrics.movingMs)} />
          <MetricCard label="휴식 시간" value={formatDuration(metrics.restMs)} />
          <MetricCard
            label="평균 속도"
            value={formatSpeed(metrics.averageSpeedKph)}
            unit="km/h"
          />
          <MetricCard
            label="최고 속도"
            value={formatSpeed(metrics.maxSpeedKph)}
            unit="km/h"
          />
          <MetricCard
            label="올라간 높이"
            value={formatElevation(metrics.elevationGainM)}
            unit="m"
          />
          <MetricCard
            label="GPS 포인트"
            value={metrics.pointCount.toLocaleString('ko-KR')}
            unit="개"
          />
        </View>

        <View style={styles.saveState}>
          <Text style={styles.saveStateTitle}>기기에 실시간 저장 중</Text>
          <Text style={styles.saveStateText}>
            네트워크와 관계없이 위치가 들어올 때마다 SQLite에 기록합니다.
          </Text>
        </View>

        {recorder.error ? <Text style={styles.error}>{recorder.error}</Text> : null}

        <View style={styles.actions}>
          <ActionButton
            label={paused ? '기록 계속' : '잠시 멈춤'}
            onPress={() => void (paused ? recorder.resume() : recorder.pause())}
            variant="secondary"
            loading={recorder.busy}
            style={styles.halfButton}
          />
          <ActionButton
            label="기억 남기기"
            onPress={() => setMomentOpen(true)}
            variant="secondary"
            style={styles.halfButton}
          />
        </View>

        <ActionButton
          label="기록 종료"
          onPress={confirmStop}
          variant="danger"
          disabled={recorder.busy}
        />
      </ScrollView>

      <Modal
        visible={momentOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMomentOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMomentOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>지금의 기억</Text>
            <Text style={styles.modalDescription}>
              사진·음성 기능을 붙이기 전 사용할 수 있는 메모 UI 골격입니다.
            </Text>
            <TextInput
              value={momentText}
              onChangeText={setMomentText}
              multiline
              placeholder="지금 보고 느낀 것을 적어 보세요."
              placeholderTextColor="#61758E"
              style={styles.input}
            />
            <ActionButton label="메모 닫기" onPress={() => setMomentOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 44, gap: 16 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07111F',
  },
  statusText: { color: '#A9B8CC' },
  header: {
    marginTop: 8,
    marginBottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#58E2D2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: '#F5FAFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#123A39',
  },
  pausedBadge: { backgroundColor: '#473C24' },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#58E2D2',
  },
  pausedDot: { backgroundColor: '#F7C86B' },
  liveText: {
    color: '#E8F7F5',
    fontSize: 11,
    fontWeight: '900',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  saveState: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#0B1A2B',
    borderWidth: 1,
    borderColor: '#17304A',
  },
  saveStateTitle: { color: '#DDEAF5', fontSize: 14, fontWeight: '800' },
  saveStateText: {
    color: '#7F94AD',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  error: { color: '#FF8B98', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  halfButton: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.66)',
  },
  modalCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#101E31',
    borderWidth: 1,
    borderColor: '#29405B',
  },
  modalTitle: { color: '#F5FAFF', fontSize: 23, fontWeight: '900' },
  modalDescription: {
    color: '#8FA2B8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  input: {
    minHeight: 120,
    marginVertical: 18,
    padding: 16,
    borderRadius: 16,
    color: '#F5FAFF',
    backgroundColor: '#081525',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#203A56',
  },
});
