import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CircleAlert,
  CircleCheck,
  Crosshair,
  MapPinOff,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react-native';

import type { LocationReadinessStatus } from '../../location/useLocationReadiness';
import { colors, radius, spacing, typography } from '../../../theme';

interface GpsStatusCompactRowProps {
  status: LocationReadinessStatus;
  accuracyM: number | null;
  onRefresh(): void;
  refreshing?: boolean;
}

interface StatusMeta {
  label: string;
  subText: string;
  color: string;
  icon: LucideIcon;
  showAccuracy: boolean;
  showRefresh: boolean;
  showInfo: boolean;
  infoText: string;
}

export function GpsStatusCompactRow({
  status,
  accuracyM,
  onRefresh,
  refreshing = false,
}: GpsStatusCompactRowProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const meta = getGpsStatusMeta(status, accuracyM);
  const Icon = meta.icon;
  const roundedAccuracy = Math.round(accuracyM ?? 0);

  const mainText = meta.showAccuracy
    ? `${meta.label} · ${roundedAccuracy}m`
    : meta.label;

  return (
    <>
      <View
        style={[styles.container, { borderColor: meta.color }]}
        accessibilityLabel={mainText}
      >
        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            <Icon size={16} color={meta.color} accessible={false} />
            <Text style={[styles.mainText, { color: meta.color }]} numberOfLines={1}>
              {mainText}
            </Text>
          </View>
          <View style={styles.rightSection}>
            {meta.showInfo ? (
              <Pressable
                onPress={() => setInfoVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="GPS 정확도 안내 보기"
                hitSlop={8}
              >
                <Text style={styles.infoButton}>ⓘ</Text>
              </Pressable>
            ) : null}
            {meta.showRefresh ? (
              <Pressable
                onPress={onRefresh}
                disabled={refreshing}
                accessibilityRole="button"
                accessibilityLabel="GPS 다시 확인"
                hitSlop={8}
                style={styles.refreshButton}
              >
                <RefreshCw size={14} color={meta.color} accessible={false} />
                <Text style={[styles.refreshText, { color: meta.color }]}>다시 확인</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {meta.subText ? (
          <Text style={styles.subText} numberOfLines={1}>{meta.subText}</Text>
        ) : null}
      </View>

      {meta.showInfo ? (
        <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setInfoVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.sheetTitle}>GPS 정확도 안내</Text>
              <Text style={styles.sheetBody}>
                {meta.infoText}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                onPress={() => setInfoVisible(false)}
              >
                <Text style={styles.closeText}>확인</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

function getGpsStatusMeta(status: LocationReadinessStatus, accuracyM: number | null): StatusMeta {
  const roundedAccuracy = Math.round(accuracyM ?? 0);
  switch (status) {
    case 'checking':
      return {
        label: 'GPS 확인 중',
        subText: '잠시만 기다려 주세요.',
        color: colors.textSecondary,
        icon: Crosshair,
        showAccuracy: false,
        showRefresh: false,
        showInfo: false,
        infoText: '',
      };
    case 'ready':
      return {
        label: 'GPS 준비 완료',
        subText: '',
        color: colors.primary,
        icon: CircleCheck,
        showAccuracy: true,
        showRefresh: false,
        showInfo: false,
        infoText: '',
      };
    case 'low_accuracy':
      return {
        label: 'GPS 정확도 낮음',
        subText: '안정될 때까지 거리·속도 계산을 보류해요.',
        color: colors.warning,
        icon: CircleAlert,
        showAccuracy: true,
        showRefresh: true,
        showInfo: true,
        infoText: `현재 위치 정확도는 약 ${roundedAccuracy}m입니다.\n\n활동 기록은 지금 시작할 수 있지만, GPS가 안정될 때까지 거리와 속도 계산을 잠시 보류합니다.\n\n첫 정상 GPS 포인트부터 거리 계산을 시작합니다.`,
      };
    case 'very_low_accuracy':
      return {
        label: 'GPS 신호 매우 약함',
        subText: '안정될 때까지 거리·속도 계산을 보류해요.',
        color: colors.danger,
        icon: CircleAlert,
        showAccuracy: true,
        showRefresh: true,
        showInfo: true,
        infoText: `현재 위치 정확도는 약 ${roundedAccuracy}m입니다.\n\n활동 기록은 지금 시작할 수 있지만, GPS가 안정될 때까지 거리와 속도 계산을 잠시 보류합니다.\n\n첫 정상 GPS 포인트부터 거리 계산을 시작합니다.`,
      };
    case 'permission_required':
      return {
        label: '위치 권한이 필요해요',
        subText: '권한을 허용하기 전에는 기록을 시작하지 않습니다.',
        color: colors.warning,
        icon: ShieldAlert,
        showAccuracy: false,
        showRefresh: true,
        showInfo: false,
        infoText: '',
      };
    case 'background_permission_required':
      return {
        label: '백그라운드 권한이 필요해요',
        subText: '위치 권한을 항상 허용으로 설정해 주세요.',
        color: colors.warning,
        icon: ShieldAlert,
        showAccuracy: false,
        showRefresh: true,
        showInfo: false,
        infoText: '',
      };
    case 'location_service_disabled':
      return {
        label: '위치 서비스가 꺼져 있어요',
        subText: '위치 서비스를 켜야 GPS 기록을 시작할 수 있어요.',
        color: colors.danger,
        icon: MapPinOff,
        showAccuracy: false,
        showRefresh: true,
        showInfo: false,
        infoText: '',
      };
    case 'error':
    default:
      return {
        label: 'GPS 상태를 확인하지 못했어요',
        subText: '잠시 후 다시 확인해 주세요.',
        color: colors.danger,
        icon: CircleAlert,
        showAccuracy: false,
        showRefresh: true,
        showInfo: false,
        infoText: '',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  mainText: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  infoButton: {
    ...typography.caption,
    fontSize: 16,
    color: colors.textSecondary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  refreshText: {
    ...typography.caption,
    fontSize: 13,
  },
  subText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.xl,
  },
  sheet: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  sheetBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  closeText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
