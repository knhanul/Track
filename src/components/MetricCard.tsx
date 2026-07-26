import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
  unit?: string;
  prominent?: boolean;
}

export function MetricCard({ label, value, unit, prominent = false }: Props) {
  return (
    <View style={[styles.card, prominent && styles.prominent]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={[styles.value, prominent && styles.prominentValue]}>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: 18,
    paddingVertical: 17,
    borderRadius: 20,
    backgroundColor: '#101E31',
    borderWidth: 1,
    borderColor: '#1A304A',
  },
  prominent: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#0D2631',
    borderColor: '#1E6A6A',
  },
  label: {
    color: '#91A4BB',
    fontSize: 13,
    fontWeight: '600',
  },
  valueLine: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    color: '#F5FAFF',
    fontSize: 27,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  prominentValue: {
    fontSize: 68,
    lineHeight: 76,
    color: '#58E2D2',
  },
  unit: {
    color: '#9CB0C5',
    fontSize: 14,
    fontWeight: '700',
  },
});
