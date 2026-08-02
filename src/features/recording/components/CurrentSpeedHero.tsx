import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatActivityType, type ActivityType } from '../../../domain/activityType';
import type { RecordingGpsState } from '../../../domain/models';
import { formatPaceFromSpeedKph, formatSpeed } from '../../../domain/format';
import { colors, radius, spacing, typography } from '../../../theme';

interface CurrentSpeedHeroProps {
  speedKph: number;
  paused: boolean;
  activityType: ActivityType;
  gpsState?: RecordingGpsState;
}

export function CurrentSpeedHero({ speedKph, paused, activityType, gpsState }: CurrentSpeedHeroProps) {
  const color = paused ? colors.warning : colors.primary;
  const usePace = activityType === 'running' || activityType === 'trail_running';
  const label = usePace ? '현재 페이스' : '현재 속도';

  const gpsUnavailable =
    gpsState === 'waiting_for_usable_fix' ||
    gpsState === 'temporarily_degraded';

  const value = gpsUnavailable
    ? '--'
    : usePace
      ? formatPaceFromSpeedKph(speedKph)
      : formatSpeed(speedKph);
  const unit = usePace ? '/km' : 'km/h';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: paused ? colors.surfaceElevated : colors.primarySoft,
          borderColor: paused ? colors.warning : colors.primaryStrong,
        },
      ]}
      accessibilityLabel={`${formatActivityType(activityType)} ${label} ${value}${unit === '/km' ? '' : '킬로미터 매시'}`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  valueLine: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  value: {
    ...typography.metricLarge,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
