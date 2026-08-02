import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CircleAlert, MessageSquarePlus, Pause, Play, Square } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';

import { ActionButton } from '../components/ActionButton';
import { CompactRecordingDashboard } from '../features/recording/components/CompactRecordingDashboard';
import { LiveRouteMap } from '../features/recording/components/LiveRouteMap';
import { useLiveRoute } from '../features/recording/useLiveRoute';
import type { RecorderController } from '../domain/models';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
  onCompleted(): void;
}

export function RecordingScreen({ recorder, onCompleted }: Props) {
  useKeepAwake();
  const metrics = recorder.metrics;
  const [momentOpen, setMomentOpen] = useState(false);
  const [momentText, setMomentText] = useState('');
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const compactHeight = height < 760;
  const narrowWidth = width <= 340;

  const route = useLiveRoute(recorder.activeRecordId);

  if (!metrics) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.statusText}>기록 데이터를 불러오고 있어요.</Text>
      </View>
    );
  }

  const paused = metrics.status === 'paused';

  function confirmStop() {
    Alert.alert(
      '활동을 마칠까요?',
      '기록은 기기에 저장되고, 인터넷 연결 후 클라우드 업로드를 시도합니다.',
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

  const mapFlex = compactHeight ? 0.42 : 0.47;
  const dashboardFlex = compactHeight ? 0.58 : 0.53;

  return (
    <>
      <View style={styles.screen}>
        <View style={{ flex: mapFlex }}>
          <LiveRouteMap
            activityType={metrics.activityType}
            recordingStatus={metrics.status === 'recording' ? 'recording' : 'paused'}
            gpsState={metrics.recordingGpsState}
            segments={route.segments}
            startPoint={route.startPoint}
            currentPoint={route.currentPoint}
          />
        </View>

        <View style={{ flex: dashboardFlex }}>
          <ScrollView
            style={styles.dashboardScroll}
            contentContainerStyle={[
              styles.dashboardContent,
              { paddingBottom: insets.bottom + spacing.sm },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <CompactRecordingDashboard metrics={metrics} compactHeight={compactHeight} />

            {recorder.error ? (
              <View style={styles.errorBanner}>
                <CircleAlert size={16} color={colors.danger} accessible={false} />
                <Text style={styles.errorText}>
                  기록을 처리하지 못했어요. 오류 내용을 확인하고 다시 시도해 주세요.
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <ActionButton
                label={paused ? '계속' : '멈춤'}
                onPress={() => void (paused ? recorder.resume() : recorder.pause())}
                icon={
                  paused ? (
                    <Play size={16} color={colors.textPrimary} accessible={false} />
                  ) : (
                    <Pause size={16} color={colors.textPrimary} accessible={false} />
                  )
                }
                variant={paused ? 'primary' : 'secondary'}
                loading={recorder.busy}
                style={[styles.thirdButton, narrowWidth && styles.thirdButtonNarrow]}
              />
              <ActionButton
                label="메모"
                onPress={() => setMomentOpen(true)}
                icon={<MessageSquarePlus size={16} color={colors.textPrimary} accessible={false} />}
                variant="secondary"
                disabled={recorder.busy}
                style={[styles.thirdButton, narrowWidth && styles.thirdButtonNarrow]}
              />
              <ActionButton
                label="종료"
                onPress={confirmStop}
                icon={<Square size={16} color={colors.textPrimary} accessible={false} />}
                variant="dangerOutline"
                disabled={recorder.busy}
                style={[styles.thirdButton, narrowWidth && styles.thirdButtonNarrow]}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={momentOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMomentOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMomentOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardArea}
          >
            <Pressable
              style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}
              onPress={() => undefined}
            >
              <Text style={styles.modalTitle}>활동 메모</Text>
              <Text style={styles.modalDescription}>지금 보고 느낀 것을 간단히 남겨 보세요.</Text>
              <TextInput
                value={momentText}
                onChangeText={setMomentText}
                multiline
                placeholder="지금 보고 느낀 것을 적어 보세요."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <ActionButton label="닫기" onPress={() => setMomentOpen(false)} />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  thirdButton: { flex: 1, paddingHorizontal: spacing.sm },
  thirdButtonNarrow: { paddingHorizontal: spacing.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modalKeyboardArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
