import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatActivityType, type SelectableActivityType } from '../../../domain/activityType';
import { colors, radius, spacing, typography } from '../../../theme';

interface ActivityInfoModalProps {
  visible: boolean;
  activityType: SelectableActivityType | null;
  onClose(): void;
}

const ACTIVITY_DETAILS: Record<SelectableActivityType, { description: string; metrics: string[] }> = {
  cycling: {
    description: 'GPS를 이용해 라이딩 경로를 기록합니다.',
    metrics: ['이동 거리', '활동 시간', '평균 속도', '올라간 높이'],
  },
  walking: {
    description: 'GPS를 이용해 산책 경로를 기록합니다.',
    metrics: ['이동 거리', '활동 시간', '평균 속도', '올라간 높이'],
  },
  running: {
    description: 'GPS를 이용해 러닝 경로를 기록합니다.',
    metrics: ['이동 거리', '활동 시간', '평균 페이스', '올라간 높이'],
  },
  hiking: {
    description: 'GPS를 이용해 산행 경로를 기록합니다.',
    metrics: ['이동 거리', '활동 시간', '평균 속도', '올라간 높이'],
  },
  trail_running: {
    description: 'GPS를 이용해 산길 러닝 경로를 기록합니다.',
    metrics: ['이동 거리', '활동 시간', '평균 페이스', '올라간 높이'],
  },
};

export function ActivityInfoModal({ visible, activityType, onClose }: ActivityInfoModalProps) {
  if (!activityType) return null;

  const detail = ACTIVITY_DETAILS[activityType];
  const label = formatActivityType(activityType);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.description}>{detail.description}</Text>

          <Text style={styles.sectionLabel}>기록되는 정보</Text>
          {detail.metrics.map((metric) => (
            <View key={metric} style={styles.metricRow}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.metricText}>{metric}</Text>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.closeText}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.xl,
  },
  sheet: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bullet: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metricText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  closeButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  closeText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
