import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type TabKey = 'today' | 'record' | 'history' | 'settings';

interface Props {
  active: TabKey;
  onChange(tab: TabKey): void;
}

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'today', label: '오늘', icon: '◉' },
  { key: 'record', label: '기록', icon: '●' },
  { key: 'history', label: '기억', icon: '▤' },
  { key: 'settings', label: '나', icon: '◎' },
];

export function BottomTabs({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.icon, selected && styles.selected]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, selected && styles.selected]}>
              {tab.label}
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
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(84,84,88,0.65)',
    backgroundColor: 'rgba(22,22,24,0.98)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minHeight: 48,
  },
  icon: { color: 'rgba(235,235,245,0.4)', fontSize: 21 },
  label: {
    color: 'rgba(235,235,245,0.4)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  selected: { color: '#0A84FF' },
});
