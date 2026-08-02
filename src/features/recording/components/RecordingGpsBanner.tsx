import React from 'react';
import { CircleAlert, Crosshair } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { RecordingGpsState } from '../../../domain/models';
import { colors, radius, spacing, typography } from '../../../theme';

interface RecordingGpsBannerProps {
  gpsState: RecordingGpsState;
  paused: boolean;
}

export function RecordingGpsBanner({ gpsState, paused }: RecordingGpsBannerProps) {
  if (paused || gpsState === 'recording_normally') {
    return null;
  }

  const isWaiting = gpsState === 'waiting_for_usable_fix';
  const title = isWaiting
    ? 'GPS 신호를 잡는 중'
    : 'GPS 신호가 약해졌어요';
  const description = isWaiting
    ? '경로가 안정되면 거리와 속도 기록을 시작합니다.'
    : '정확도가 회복될 때까지 거리 계산을 잠시 보류합니다.';
  const Icon = isWaiting ? Crosshair : CircleAlert;
  const color = isWaiting ? colors.textSecondary : colors.warning;

  return (
    <View
      style={[styles.container, { borderColor: color }]}
      accessibilityLabel={`${title}. ${description}`}
    >
      <Icon size={16} color={color} accessible={false} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
