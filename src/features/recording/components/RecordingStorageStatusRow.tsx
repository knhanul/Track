import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RecordingGpsState } from '../../../domain/models';
import type { SyncStatus } from '../../../domain/models';
import { colors, spacing, typography } from '../../../theme';

interface RecordingStorageStatusRowProps {
  pointCount: number;
  syncStatus: SyncStatus;
  gpsState: RecordingGpsState;
  paused: boolean;
}

export function RecordingStorageStatusRow({
  pointCount,
  gpsState,
  paused,
}: RecordingStorageStatusRowProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeText = formatClock(now);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`현재 시각 ${timeText}, GPS 포인트 ${pointCount}개`}
    >
      <View style={[styles.dot, { backgroundColor: getDotColor(gpsState, paused) }]} />
      <Text style={styles.text} numberOfLines={1}>
        {timeText}
      </Text>
      <Text style={styles.pointCount}>· GPS {pointCount}개</Text>
    </View>
  );
}

function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getDotColor(gpsState: RecordingGpsState, paused: boolean): string {
  if (paused) return colors.warning;
  if (gpsState !== 'recording_normally') return colors.warning;
  return colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  text: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  pointCount: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 0,
  },
});
