import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, CircleDot } from 'lucide-react-native';

import { ActionButton } from '../components/ActionButton';
import { ActivityTypeSelector } from '../features/activity/components/ActivityTypeSelector';
import { ActivityInfoModal } from '../features/activity/components/ActivityInfoModal';
import { GpsStatusCompactRow } from '../features/recording/components/GpsStatusCompactRow';
import { RecordingStorageInfoRow } from '../features/recording/components/RecordingStorageInfoRow';
import { useLocationReadiness } from '../features/location/useLocationReadiness';
import { getLastActivityType } from '../database/recordRepository';
import {
  ACTIVITY_TYPE_OPTIONS,
  formatActivityType,
  type SelectableActivityType,
} from '../domain/activityType';
import type { RecorderController } from '../domain/models';
import type { LocationReadinessStatus } from '../features/location/useLocationReadiness';
import { getInitialRecordingGpsState } from '../location/gpsQuality';
import { BOTTOM_TAB_BASE_HEIGHT } from '../constants/layout';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  recorder: RecorderController;
}

type ActionType = 'primary' | 'secondary';

function getActivityDescription(type: SelectableActivityType): string {
  const option = ACTIVITY_TYPE_OPTIONS.find((o) => o.type === type);
  return option?.description ?? '';
}

function getPrimaryLabel(
  status: LocationReadinessStatus,
  selectedActivityType: SelectableActivityType | null,
): string {
  switch (status) {
    case 'ready':
      return selectedActivityType ? `${formatActivityType(selectedActivityType)} 기록 시작` : '활동을 선택해 주세요';
    case 'low_accuracy':
    case 'very_low_accuracy':
      return selectedActivityType ? `그래도 ${formatActivityType(selectedActivityType)} 기록 시작` : '활동을 선택해 주세요';
    case 'permission_required':
      return '위치 권한 허용';
    case 'background_permission_required':
      return '백그라운드 권한 허용';
    case 'location_service_disabled':
      return '위치 설정 열기';
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
  if (status === 'very_low_accuracy') {
    return 'danger';
  }
  return 'primary';
}

function getPrimaryIcon(status: LocationReadinessStatus) {
  switch (status) {
    case 'ready':
      return <CircleDot size={18} color={colors.textPrimary} />;
    case 'low_accuracy':
    case 'very_low_accuracy':
      return <CircleAlert size={18} color={colors.textPrimary} />;
    default:
      return undefined;
  }
}

export function RecordStartScreen({ recorder }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compactHeight = height < 760;
  const readiness = useLocationReadiness();
  const [actionBusy, setActionBusy] = useState<ActionType | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<SelectableActivityType | null>(null);
  const [activityInfoVisible, setActivityInfoVisible] = useState(false);

  useEffect(() => {
    let active = true;

    void getLastActivityType().then((activityType) => {
      if (active) {
        setSelectedActivityType(activityType);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const primaryLabel = getPrimaryLabel(readiness.status, selectedActivityType);
  const primaryIcon = getPrimaryIcon(readiness.status);
  const primaryLoading =
    actionBusy === 'primary' ||
    recorder.busy ||
    (readiness.status === 'checking' && readiness.refreshing);
  const actionBlocked = recorder.busy || actionBusy !== null;

  const activityDescription = selectedActivityType
    ? `${formatActivityType(selectedActivityType)} · ${getActivityDescription(selectedActivityType)}`
    : '활동을 선택해 주세요.';

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
      case 'low_accuracy':
      case 'very_low_accuracy':
        if (!selectedActivityType) {
          return;
        }

        const initialGpsState = getInitialRecordingGpsState(readiness.accuracyM);
        await runAction('primary', () => recorder.start(selectedActivityType, initialGpsState));
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
      case 'error':
        await runAction('primary', () => readiness.refresh());
        return;
      case 'checking':
      default:
        return;
    }
  }

  const scrollPaddingBottom =
    CTA_HEIGHT + CTA_MARGIN_TOP + CTA_MARGIN_BOTTOM +
    BOTTOM_TAB_BASE_HEIGHT + insets.bottom + spacing.sm;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + (compactHeight ? spacing.sm : spacing.md), paddingBottom: scrollPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={compactHeight ? styles.titleCompact : styles.title}>활동 기록</Text>
        <Text style={compactHeight ? styles.subtitleCompact : styles.subtitle}>
          어떤 활동을 기록할까요?
        </Text>

        <ActivityTypeSelector
          value={selectedActivityType}
          onChange={setSelectedActivityType}
          disabled={recorder.busy || actionBusy !== null}
          compact
        />

        <View style={styles.descriptionRow}>
          <Text style={styles.activityDescription} numberOfLines={1} ellipsizeMode="tail">
            {activityDescription}
          </Text>
          {selectedActivityType ? (
            <Pressable
              onPress={() => setActivityInfoVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`${formatActivityType(selectedActivityType)} 기록 정보 보기`}
              hitSlop={8}
            >
              <Text style={styles.infoButton}>ⓘ</Text>
            </Pressable>
          ) : null}
        </View>

        <GpsStatusCompactRow
          status={readiness.status}
          accuracyM={readiness.accuracyM}
          onRefresh={() => void readiness.refresh()}
          refreshing={readiness.refreshing}
        />

        <RecordingStorageInfoRow />

        {recorder.error ? (
          <View style={styles.errorBanner}>
            <CircleAlert size={16} color={colors.danger} />
            <Text style={styles.errorText}>기록을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.ctaContainer,
          { bottom: BOTTOM_TAB_BASE_HEIGHT + insets.bottom },
        ]}
      >
        <ActionButton
          label={primaryLabel}
          icon={primaryIcon}
          onPress={() => void handlePrimaryPress()}
          variant={getPrimaryVariant(readiness.status)}
          loading={primaryLoading}
          disabled={
            readiness.status === 'checking' ||
            ((readiness.status === 'ready' ||
              readiness.status === 'low_accuracy' ||
              readiness.status === 'very_low_accuracy') &&
              !selectedActivityType) ||
            (actionBlocked && actionBusy !== 'primary')
          }
          style={styles.ctaButton}
        />
      </View>

      <ActivityInfoModal
        visible={activityInfoVisible}
        activityType={selectedActivityType}
        onClose={() => setActivityInfoVisible(false)}
      />
    </View>
  );
}

const CTA_HEIGHT = 56;
const CTA_MARGIN_TOP = spacing.sm;
const CTA_MARGIN_BOTTOM = spacing.sm;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  titleCompact: {
    ...typography.sectionTitle,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  subtitleCompact: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  infoButton: {
    ...typography.caption,
    fontSize: 16,
    color: colors.textSecondary,
    flexShrink: 0,
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
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  ctaButton: {
    minHeight: CTA_HEIGHT,
  },
});
