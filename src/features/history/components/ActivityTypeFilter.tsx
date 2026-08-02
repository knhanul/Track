import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { formatActivityType, type ActivityType } from '../../../domain/activityType';
import type { ActivityHistoryTypeFilter } from '../historySummary';
import { colors, radius, spacing, typography } from '../../../theme';

interface ActivityTypeFilterProps {
  value: ActivityHistoryTypeFilter;
  onChange(filter: ActivityHistoryTypeFilter): void;
  showUnknown: boolean;
}

interface FilterOption {
  value: ActivityHistoryTypeFilter;
  label: string;
}

function buildOptions(showUnknown: boolean): FilterOption[] {
  const options: FilterOption[] = [
    { value: 'all', label: '전체' },
    { value: 'cycling', label: formatActivityType('cycling') },
    { value: 'walking', label: formatActivityType('walking') },
    { value: 'running', label: formatActivityType('running') },
    { value: 'hiking', label: formatActivityType('hiking') },
    { value: 'trail_running', label: formatActivityType('trail_running') },
  ];

  if (showUnknown) {
    options.push({ value: 'unknown' as ActivityType, label: formatActivityType('unknown') });
  }

  return options;
}

export function ActivityTypeFilter({ value, onChange, showUnknown }: ActivityTypeFilterProps) {
  const options = buildOptions(showUnknown);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="활동 유형 필터"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${selected ? ' 선택됨' : ''}`}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.primary,
  },
});
