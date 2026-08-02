import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActivityHistoryPeriod } from '../historyPeriod';
import { colors, radius, spacing, typography } from '../../../theme';

interface ActivityPeriodSelectorProps {
  value: ActivityHistoryPeriod;
  onChange(period: ActivityHistoryPeriod): void;
}

const PERIOD_OPTIONS: { value: ActivityHistoryPeriod; label: string }[] = [
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'all', label: '전체' },
];

export function ActivityPeriodSelector({ value, onChange }: ActivityPeriodSelectorProps) {
  return (
    <View
 style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="기간 선택"
    >
      {PERIOD_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${selected ? ' 선택됨' : ''}`}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  segmentPressed: {
    opacity: 0.7,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
});
