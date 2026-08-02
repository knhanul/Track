import React from 'react';
import {
  CircleAlert,
  CircleCheck,
  Crosshair,
  MapPinOff,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { LocationReadinessStatus } from '../useLocationReadiness';
import { colors, radius, spacing, typography } from '../../../theme';

interface LocationReadinessCardProps {
  status: LocationReadinessStatus;
  accuracyM: number | null;
}

interface StatusMeta {
  title: string;
  primaryText: string;
  helperText: string;
  color: string;
  icon: LucideIcon;
  showAccuracy: boolean;
}

export function LocationReadinessCard({
  status,
  accuracyM,
}: LocationReadinessCardProps) {
  const meta = getStatusMeta(status);
  const roundedAccuracy = Math.round(accuracyM ?? 0);

  return (
    <View
      style={[styles.card, { borderColor: meta.color }]}
      accessibilityLabel={buildAccessibilityLabel(status, roundedAccuracy)}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        <meta.icon size={20} color={meta.color} />
        <Text style={[styles.title, { color: meta.color }]}>{meta.title}</Text>
      </View>

      {meta.showAccuracy ? (
        <View style={styles.accuracyBlock}>
          <Text style={styles.accuracyLabel}>현재 위치 정확도</Text>
          <Text style={[styles.accuracyValue, { color: meta.color }]}>{roundedAccuracy}m</Text>
        </View>
      ) : (
        <Text style={styles.primaryText}>{meta.primaryText}</Text>
      )}

      <Text style={styles.helperText}>{meta.helperText}</Text>
    </View>
  );
}

function getStatusMeta(status: LocationReadinessStatus): StatusMeta {
  switch (status) {
    case 'checking':
      return {
        title: 'GPS 확인 중',
        primaryText: '현재 위치를 확인하고 있어요.',
        helperText: '잠시만 기다려 주세요.',
        color: colors.textSecondary,
        icon: Crosshair,
        showAccuracy: false,
      };
    case 'ready':
      return {
        title: 'GPS 준비 완료',
        primaryText: '',
        helperText: '화면이 꺼져도 진행 중인 야외활동을 계속 기록할 수 있어요.',
        color: colors.primary,
        icon: CircleCheck,
        showAccuracy: true,
      };
    case 'permission_required':
      return {
        title: '위치 권한이 필요해요',
        primaryText: '야외활동의 경로와 속도를 기록하려면 위치 권한을 허용해 주세요.',
        helperText: '권한을 허용하기 전에는 기록을 시작하지 않습니다.',
        color: colors.warning,
        icon: ShieldAlert,
        showAccuracy: false,
      };
    case 'background_permission_required':
      return {
        title: '백그라운드 권한이 필요해요',
        primaryText: '화면이 꺼진 상태에서도 진행 중인 야외활동 경로를 계속 기록할 수 있어야 해요.',
        helperText: '위치 권한을 항상 허용으로 설정해 주세요.',
        color: colors.warning,
        icon: ShieldAlert,
        showAccuracy: false,
      };
    case 'location_service_disabled':
      return {
        title: '위치 서비스가 꺼져 있어요',
        primaryText: '스마트폰의 위치 서비스를 켜 주세요.',
        helperText: '위치 서비스가 켜져야 야외활동 GPS 기록을 시작할 수 있어요.',
        color: colors.danger,
        icon: MapPinOff,
        showAccuracy: false,
      };
    case 'low_accuracy':
      return {
        title: 'GPS 정확도가 낮아요',
        primaryText: '',
        helperText: '지금 시작하면 경로의 시작 부분이 부정확할 수 있어요. GPS가 안정될 때까지 거리와 속도 계산을 보류합니다.',
        color: colors.warning,
        icon: CircleAlert,
        showAccuracy: true,
      };
    case 'very_low_accuracy':
      return {
        title: 'GPS 신호가 매우 약해요',
        primaryText: '',
        helperText: '지금 시작할 수는 있지만 경로의 시작 부분이 정확하지 않을 수 있어요. GPS가 안정될 때까지 거리와 속도 계산을 보류합니다.',
        color: colors.danger,
        icon: CircleAlert,
        showAccuracy: true,
      };
    case 'error':
    default:
      return {
        title: 'GPS 상태를 확인하지 못했어요',
        primaryText: '현재 위치 정보를 불러오지 못했습니다.',
        helperText: '잠시 후 다시 확인해 주세요.',
        color: colors.danger,
        icon: CircleAlert,
        showAccuracy: false,
      };
  }
}

function buildAccessibilityLabel(status: LocationReadinessStatus, accuracyM: number): string {
  switch (status) {
    case 'ready':
      return `GPS 준비 완료, 현재 위치 정확도 ${accuracyM}미터`;
    case 'low_accuracy':
      return `GPS 정확도가 낮아요, 현재 위치 정확도 ${accuracyM}미터`;
    case 'very_low_accuracy':
      return accuracyM > 0
        ? `GPS 신호가 매우 약해요, 현재 위치 정확도 ${accuracyM}미터`
        : 'GPS 신호가 매우 약해요, 현재 위치 정확도를 확인할 수 없어요';
    case 'permission_required':
      return '위치 권한이 필요해요';
    case 'background_permission_required':
      return '백그라운드 권한이 필요해요';
    case 'location_service_disabled':
      return '위치 서비스가 꺼져 있어요';
    case 'error':
      return 'GPS 상태를 확인하지 못했어요';
    case 'checking':
    default:
      return 'GPS 확인 중';
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
  },
  title: {
    ...typography.sectionTitle,
  },
  primaryText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  accuracyBlock: {
    gap: spacing.xxs,
  },
  accuracyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  accuracyValue: {
    ...typography.metricStatus,
    fontVariant: ['tabular-nums'],
  },
});
