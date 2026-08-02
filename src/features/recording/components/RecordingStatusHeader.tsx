import React from 'react';
import { Pause, Radio } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { formatActivityType } from '../../../domain/activityType';
import type { RecordingGpsState } from '../../../domain/models';
import { colors, radius, spacing, typography } from '../../../theme';

interface RecordingStatusHeaderProps {
  status: 'recording' | 'paused' | 'completed';
  activityType: import('../../../domain/activityType').ActivityType;
  recordingGpsState?: RecordingGpsState;
}

export function RecordingStatusHeader({ status, activityType, recordingGpsState }: RecordingStatusHeaderProps) {
  const paused = status === 'paused';
  const activityLabel = formatActivityType(activityType);
  const gpsWaiting = recordingGpsState === 'waiting_for_usable_fix';
  const title = paused
    ? `${activityLabel} 기록 일시정지`
    : gpsWaiting
      ? `${activityLabel} 기록 중`
      : `${activityLabel} 기록 중`;
  const badgeText = paused ? 'PAUSED' : 'LIVE';
  const badgeColor = paused ? colors.warning : colors.primary;

  return (
    <View style={styles.container} accessibilityLabel={title}>
      <Text style={styles.title}>{title}</Text>

      <View style={[styles.badge, { backgroundColor: paused ? colors.warningSoft : colors.primarySoft }]}>
        {paused ? (
          <Pause size={14} color={badgeColor} accessible={false} />
        ) : (
          <Radio size={14} color={badgeColor} accessible={false} />
        )}
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
