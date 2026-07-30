import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  CircleDot,
  History,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BOTTOM_TAB_BASE_HEIGHT,
  RECORD_BUTTON_RAISE,
} from '../constants/layout';
import { colors, radius, spacing, typography } from '../theme';

export type TabKey = 'today' | 'history' | 'settings';

interface BottomTabsProps {
  activeTab: TabKey;
  recordStartActive: boolean;
  onSelectTab(tab: TabKey): void;
  onPressRecord(): void;
}

export function BottomTabs({
  activeTab,
  recordStartActive,
  onSelectTab,
  onPressRecord,
}: BottomTabsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          height: BOTTOM_TAB_BASE_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      <TabItem
        icon={CalendarDays}
        label="오늘"
        selected={!recordStartActive && activeTab === 'today'}
        onPress={() => onSelectTab('today')}
      />

      <RecordAction selected={recordStartActive} onPress={onPressRecord} />

      <TabItem
        icon={History}
        label="기억"
        selected={!recordStartActive && activeTab === 'history'}
        onPress={() => onSelectTab('history')}
      />

      <TabItem
        icon={UserRound}
        label="나"
        selected={!recordStartActive && activeTab === 'settings'}
        onPress={() => onSelectTab('settings')}
      />
    </View>
  );
}

interface TabItemProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onPress(): void;
}

function TabItem({ icon: Icon, label, selected, onPress }: TabItemProps) {
  const color = selected ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Icon size={21} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

interface RecordActionProps {
  selected: boolean;
  onPress(): void;
}

function RecordAction({ selected, onPress }: RecordActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="새 일상 기록 시작"
      accessibilityHint="GPS 기록 준비 화면을 엽니다"
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.recordButton,
          { backgroundColor: selected ? colors.primary : colors.primaryStrong },
        ]}
      >
        <CircleDot size={24} color={colors.background} />
      </View>
      <Text
        style={[
          styles.label,
          { color: selected ? colors.primary : colors.textSecondary },
        ]}
      >
        기록
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.backgroundElevated,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xxs,
    minHeight: 48,
  },
  recordButton: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -RECORD_BUTTON_RAISE }],
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xxs,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.84,
  },
});
