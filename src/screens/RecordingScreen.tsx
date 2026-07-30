import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { MetricCard } from '../components/MetricCard';
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatSpeed,
} from '../domain/format';
import type { RecorderController } from '../domain/models';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
  onCompleted(): void;
}

export function RecordingScreen({ recorder, onCompleted }: Props) {
  const metrics = recorder.metrics;
  const [momentOpen, setMomentOpen] = useState(false);
  const [momentText, setMomentText] = useState('');
  const insets = useSafeAreaInsets();

  if (!metrics) {
    return (
      <ScreenContainer includeBottomTabSpace={false} contentStyle={styles.center}>
        <Text style={styles.statusText}>기록 데이터를 불러오고 있어요.</Text>
      </ScreenContainer>
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
          onPress: () =>
            void (async () => {
              await recorder.stop();
              onCompleted();
            })(),
        },
      ],
    );
  }

  return (
    <>
      <ScreenContainer
        scrollable
        includeBottomTabSpace={false}
        contentStyle={styles.container}
      >
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
      </ScreenContainer>

      <Modal
        visible={momentOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMomentOpen(false)}
      >
        <Pressable
          style={[styles.modalBackdrop, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={() => setMomentOpen(false)}
        >
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
  container: { gap: spacing.md },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 1.4,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  pausedBadge: { backgroundColor: colors.surfaceElevated },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pausedDot: { backgroundColor: colors.warning },
  liveText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  saveState: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveStateTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  saveStateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  halfButton: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 120,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
