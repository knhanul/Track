import React from 'react';
import {
  Activity,
  Bike,
  Footprints,
  Mountain,
  Route,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  ACTIVITY_TYPE_OPTIONS,
  type SelectableActivityType,
} from '../../../domain/activityType';
import { colors, radius, spacing, typography } from '../../../theme';

interface ActivityTypeSelectorProps {
  value: SelectableActivityType | null;
  onChange(type: SelectableActivityType): void;
  disabled?: boolean;
  compact?: boolean;
}

const ICONS: Record<SelectableActivityType, LucideIcon> = {
  cycling: Bike,
  walking: Footprints,
  running: Activity,
  hiking: Mountain,
  trail_running: Route,
};

export function ActivityTypeSelector({ value, onChange, disabled = false, compact = false }: ActivityTypeSelectorProps) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 360 ? 3 : 2;
  const cardWidth = (width - spacing.lg * 2 - spacing.sm * (numColumns - 1)) / numColumns;

  return (
    <View style={styles.container}>
      {ACTIVITY_TYPE_OPTIONS.map((option) => {
        const selected = value === option.type;
        const Icon = ICONS[option.type];

        return (
          <Pressable
            key={option.type}
            onPress={() => onChange(option.type)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.option,
              compact && styles.optionCompact,
              { width: cardWidth },
              selected && styles.optionSelected,
              disabled && styles.optionDisabled,
              pressed && !disabled && styles.optionPressed,
            ]}
          >
            <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
              <Icon size={compact ? 22 : 18} color={selected ? colors.primary : colors.textSecondary} accessible={false} />
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 112,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCompact: {
    minHeight: 80,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionPressed: {
    opacity: 0.86,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  iconBoxSelected: {
    backgroundColor: colors.background,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
  },
});
