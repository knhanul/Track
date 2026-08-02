import React from 'react';
import { History } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

export interface HistoryEmptyStateProps {
  hasRecords?: boolean;
}

export function HistoryEmptyState({ hasRecords = false }: HistoryEmptyStateProps) {
  if (hasRecords) {
    return (
      <View
        style={styles.container}
        accessibilityLabel="선택한 조건의 활동 기록이 없어요. 기간이나 활동 유형을 변경해 보세요."
      >
        <History size={28} color={colors.textSecondary} accessible={false} />
        <Text style={styles.title}>선택한 조건의 활동 기록이 없어요.</Text>
        <Text style={styles.description}>기간이나 활동 유형을 변경해 보세요.</Text>
      </View>
    );
  }
  return (
    <View style={styles.container} accessibilityLabel="아직 활동 기록이 없어요. 첫 야외활동을 기록하면 이곳에 차곡차곡 모입니다.">
      <History size={28} color={colors.textSecondary} accessible={false} />
      <Text style={styles.title}>아직 활동 기록이 없어요.</Text>
      <Text style={styles.description}>첫 야외활동을 기록하면 이곳에 차곡차곡 모입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
