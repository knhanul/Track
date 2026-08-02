import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Activity,
  CalendarDays,
  CircleDot,
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
  recordActive: boolean;
  onSelectTab(tab: TabKey): void;
  onPressRecord(): void;
}

export function BottomTabs({
  activeTab,
  recordActive,
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
        selected={!recordActive && activeTab === 'today'}
        onPress={() => onSelectTab('today')}
      />

      <RecordAction active={recordActive} onPress={onPressRecord} />

      <TabItem
        icon={Activity}
        label="활동"
        selected={!recordActive && activeTab === 'history'}
        onPress={() => onSelectTab('history')}
      />

      <TabItem
        icon={UserRound}
        label="나"
        selected={!recordActive && activeTab === 'settings'}
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
  active: boolean;
  onPress(): void;
}

function RecordAction({ active, onPress }: RecordActionProps) {
  const bgColor = active ? colors.primary : colors.surfaceElevated;
  const iconColor = active ? colors.background : colors.textMuted;
  const labelColor = active ? colors.primary : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={active ? '활동 기록 화면 선택됨' : '활동 기록 열기'}
      accessibilityHint="GPS 기록 준비 화면을 엽니다"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.recordButtonWrap}>
        <View
          style={[
            styles.recordButton,
            { backgroundColor: bgColor },
            !active && styles.recordButtonInactive,
          ]}
        >
          <CircleDot size={24} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.label, { color: labelColor }]}>기록</Text>
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
  recordButtonWrap: {
    height: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  recordButton: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -RECORD_BUTTON_RAISE }],
  },
  recordButtonInactive: {
    borderWidth: 1.5,
    borderColor: colors.border,
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
