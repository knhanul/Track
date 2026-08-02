import React from 'react';
import { Database } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

interface RecordingStorageStatusProps {
  pointCount: number;
}

export function RecordingStorageStatus({ pointCount }: RecordingStorageStatusProps) {
  const hasPoints = pointCount > 0;

  return (
    <View style={styles.container} accessibilityLabel={`GPS 포인트 ${pointCount.toLocaleString('ko-KR')}개`}>
      <Database size={18} color={colors.primary} accessible={false} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {hasPoints ? '기기에 안전하게 저장 중' : 'GPS 위치를 기다리고 있어요.'}
        </Text>
        <Text style={styles.description}>
          {hasPoints
            ? `GPS 포인트 ${pointCount.toLocaleString('ko-KR')}개`
            : '첫 위치가 확인되면 기기에 저장합니다.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
