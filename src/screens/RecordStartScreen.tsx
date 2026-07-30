import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import {
  CircleAlert,
  CircleDot,
  CloudUpload,
  Database,
  Moon,
  RefreshCw,
} from 'lucide-react-native';

import { ActionButton } from '../components/ActionButton';
import { FeatureRow } from '../components/FeatureRow';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { LocationReadinessCard } from '../features/location/components/LocationReadinessCard';
import { useLocationReadiness } from '../features/location/useLocationReadiness';
import type { RecorderController } from '../domain/models';
import type { LocationReadinessStatus } from '../features/location/useLocationReadiness';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
}

type ActionType = 'primary' | 'secondary';

function getPrimaryLabel(status: LocationReadinessStatus): string {
  switch (status) {
    case 'ready':
      return '기록 시작';
    case 'permission_required':
      return '위치 권한 허용';
    case 'background_permission_required':
      return '백그라운드 권한 허용';
    case 'location_service_disabled':
      return '위치 설정 열기';
    case 'low_accuracy':
      return 'GPS 다시 확인';
    case 'error':
      return '다시 확인';
    case 'checking':
    default:
      return 'GPS 확인 중';
  }
}

function getPrimaryVariant(status: LocationReadinessStatus): 'primary' | 'danger' {
  if (status === 'location_service_disabled' || status === 'error') {
    return 'danger';
  }
  return 'primary';
}

function getPrimaryIcon(status: LocationReadinessStatus) {
  switch (status) {
    case 'ready':
      return <CircleDot size={18} color={colors.textPrimary} />;
    case 'low_accuracy':
    case 'error':
      return <RefreshCw size={18} color={colors.textPrimary} />;
    default:
      return undefined;
  }
}

function canShowSecondaryButton(status: LocationReadinessStatus): boolean {
  return (
    status === 'permission_required' ||
    status === 'background_permission_required' ||
    status === 'location_service_disabled'
  );
}

export function RecordStartScreen({ recorder }: Props) {
  const readiness = useLocationReadiness();
  const [actionBusy, setActionBusy] = useState<ActionType | null>(null);

  const primaryLabel = getPrimaryLabel(readiness.status);
  const primaryIcon = getPrimaryIcon(readiness.status);
  const showSecondaryButton = canShowSecondaryButton(readiness.status);
  const primaryLoading =
    actionBusy === 'primary' ||
    recorder.busy ||
    (readiness.status === 'checking' && readiness.refreshing);
  const secondaryLoading = actionBusy === 'secondary';
  const actionBlocked = recorder.busy || actionBusy !== null;

  async function runAction(type: ActionType, task: () => Promise<void>) {
    if (actionBlocked) {
      return;
    }

    setActionBusy(type);
    try {
      await task();
    } finally {
      setActionBusy(null);
    }
  }

  async function handlePrimaryPress() {
    switch (readiness.status) {
      case 'ready':
        await runAction('primary', () => recorder.start());
        return;
      case 'permission_required':
        await runAction('primary', () => readiness.requestForeground());
        return;
      case 'background_permission_required':
        await runAction('primary', () => readiness.requestBackground());
        return;
      case 'location_service_disabled':
        await runAction('primary', async () => {
          try {
            await Linking.openSettings();
          } catch {
            Alert.alert('위치 설정 확인', '설정에서 위치 서비스를 켜 주세요.');
          }
        });
        return;
      case 'low_accuracy':
      case 'error':
        await runAction('primary', () => readiness.refresh());
        return;
      case 'checking':
      default:
        return;
    }
  }

  async function handleSecondaryPress() {
    await runAction('secondary', () => readiness.refresh());
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Text style={styles.title}>기록 준비</Text>
      <Text style={styles.description}>지금의 움직임을 일상 기록으로 남겨 보세요.</Text>

      <LocationReadinessCard status={readiness.status} accuracyM={readiness.accuracyM} />

      <View style={styles.featureSection}>
        <FeatureRow
          icon={<Database size={18} color={colors.primary} />}
          title="기기에 먼저 저장"
          description="인터넷이 없어도 기록이 남아요."
        />
        <FeatureRow
          icon={<Moon size={18} color={colors.primary} />}
          title="백그라운드 기록"
          description="화면이 꺼져도 이동을 계속 기록해요."
        />
        <FeatureRow
          icon={<CloudUpload size={18} color={colors.primary} />}
          title="자동 동기화"
          description="인터넷이 연결되면 클라우드 업로드를 시도해요."
        />
      </View>

      {recorder.error ? (
        <View style={styles.errorBanner}>
          <CircleAlert size={16} color={colors.danger} />
          <Text style={styles.errorText}>기록을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
        </View>
      ) : null}

      <ActionButton
        label={primaryLabel}
        icon={primaryIcon}
        onPress={() => void handlePrimaryPress()}
        variant={getPrimaryVariant(readiness.status)}
        loading={primaryLoading}
        disabled={
          readiness.status === 'checking' ||
          (actionBlocked && actionBusy !== 'primary')
        }
      />

      {showSecondaryButton ? (
        <ActionButton
          label="상태 다시 확인"
          icon={<RefreshCw size={18} color={colors.textPrimary} />}
          onPress={() => void handleSecondaryPress()}
          variant="secondary"
          loading={secondaryLoading}
          disabled={actionBlocked && actionBusy !== 'secondary'}
          style={styles.secondaryButton}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  featureSection: {
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});
