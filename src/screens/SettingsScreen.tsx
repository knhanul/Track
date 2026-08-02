import React from 'react';
import {
  Alert,
  Pressable,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Cloud,
  Database,
  Info,
  LocateFixed,
  MapPin,
  Moon,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SettingsRow } from '../features/settings/components/SettingsRow';
import { SettingsSection } from '../features/settings/components/SettingsSection';
import {
  SettingsStatusBadge,
  type SettingsStatusTone,
} from '../features/settings/components/SettingsStatusBadge';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { SignedInAccountCard } from '../components/auth/SignedInAccountCard';
import { useAuth } from '../auth/useAuth';
import { isGoogleAuthConfigured } from '../auth/googleAuth';
import { getPendingSyncRecordCount } from '../database/recordRepository';
import { useSettingsStatus } from '../features/settings/useSettingsStatus';
import { triggerSyncNow } from '../sync/syncService';
import { colors, spacing, typography } from '../theme';

export function SettingsScreen() {
  const { status } = useSettingsStatus();
  const auth = useAuth();
  const [pendingCount, setPendingCount] = React.useState(0);
  const googleConfigured = isGoogleAuthConfigured();

  const refreshPendingCount = React.useCallback(async () => {
    try {
      const count = await getPendingSyncRecordCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  React.useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount, auth.status]);

  const locationServiceStatus = status.loading
    ? { label: '확인 중', tone: 'neutral' as SettingsStatusTone }
    : status.locationServicesEnabled
      ? { label: '켜짐', tone: 'success' as SettingsStatusTone }
      : { label: '꺼짐', tone: 'danger' as SettingsStatusTone };

  const foregroundPermissionStatus = status.loading
    ? { label: '확인 중', tone: 'neutral' as SettingsStatusTone }
    : status.foregroundPermissionGranted
      ? { label: '허용됨', tone: 'success' as SettingsStatusTone }
      : { label: '확인 필요', tone: 'warning' as SettingsStatusTone };

  const backgroundPermissionReady =
    status.foregroundPermissionGranted && status.backgroundPermissionGranted;
  const backgroundPermissionStatus = status.loading
    ? { label: '확인 중', tone: 'neutral' as SettingsStatusTone }
    : backgroundPermissionReady
      ? { label: '허용됨', tone: 'success' as SettingsStatusTone }
      : { label: '확인 필요', tone: 'warning' as SettingsStatusTone };

  const cloudStatus = status.cloudConfigured
    ? { label: '연결 준비됨', tone: 'success' as SettingsStatusTone }
    : { label: '미설정', tone: 'neutral' as SettingsStatusTone };

  async function openAppSettings() {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        '설정을 열 수 없어요',
        '스마트폰 설정에서 nuni track의 위치 권한을 확인해 주세요.',
      );
    }
  }

  async function handleManualSync() {
    triggerSyncNow();
    await refreshPendingCount();
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Text style={styles.title}>나</Text>
      <Text style={styles.description}>기록 환경과 계정 동기화 상태를 관리해요.</Text>

      <SettingsSection title="Google 로그인">
        {auth.status === 'signed_in' || auth.status === 'offline_session' ? (
          <View style={styles.authBlock}>
            {auth.user ? <SignedInAccountCard user={auth.user} /> : null}

            <View style={styles.syncStatusBox}>
              <Text style={styles.syncStatusTitle}>동기화 상태</Text>
              <Text style={styles.syncStatusValue}>업로드 대기 {pendingCount}건</Text>
              <Text style={styles.syncStatusHint}>
                {auth.status === 'offline_session'
                  ? '오프라인 세션이에요. 연결이 복구되면 다시 시도해 주세요.'
                  : '로그인된 계정으로 업로드를 시도할 수 있어요.'}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryActionButton, pressed && styles.actionButtonPressed]}
                onPress={() => void handleManualSync()}
                accessibilityRole="button"
                accessibilityLabel="지금 동기화"
              >
                <Text style={styles.secondaryActionButtonText}>지금 동기화</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dangerActionButton, pressed && styles.actionButtonPressed]}
                onPress={() => void auth.signOut()}
                accessibilityRole="button"
                accessibilityLabel="로그아웃"
              >
                <Text style={styles.dangerActionButtonText}>로그아웃</Text>
              </Pressable>
            </View>

            {auth.status === 'offline_session' ? (
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && styles.actionButtonPressed]}
                onPress={() => void auth.retrySession()}
                accessibilityRole="button"
                accessibilityLabel="세션 다시 연결"
              >
                <Text style={styles.retryButtonText}>세션 다시 연결</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.authBlock}>
            <Text style={styles.authMessage}>
              기록은 이 기기에 안전하게 저장돼요.{"\n"}
              Google로 로그인하면 여러 기기에서{"\n"}
              활동 기록을 동기화할 수 있어요.
            </Text>

            <GoogleSignInButton
              onPress={() => void auth.signInWithGoogle()}
              disabled={!googleConfigured}
              loading={auth.status === 'signing_in'}
            />

            {auth.status === 'signing_in' ? (
              <Text style={styles.signingInText}>Google 계정을 확인하고 있어요.</Text>
            ) : null}

            {!googleConfigured && __DEV__ ? (
              <Text style={styles.warningText}>Google 로그인 설정이 완료되지 않았어요.</Text>
            ) : null}

            {auth.errorMessage ? <Text style={styles.warningText}>{auth.errorMessage}</Text> : null}

            <Text style={styles.authHint}>로그인하지 않고도 모든 활동을 기록할 수 있어요.</Text>
          </View>
        )}
      </SettingsSection>

      <SettingsSection title="기록 환경">
        <SettingsRow
          icon={<LocateFixed size={20} color={colors.primary} accessible={false} />}
          title="위치 서비스"
          description={
            status.locationServicesEnabled
              ? '스마트폰의 위치 서비스를 사용하고 있어요.'
              : 'GPS 기록을 시작하려면 위치 서비스를 켜야 해요.'
          }
          status={<SettingsStatusBadge label={locationServiceStatus.label} tone={locationServiceStatus.tone} />}
          onPress={() => void openAppSettings()}
        />

        <SettingsRow
          icon={<MapPin size={20} color={colors.primary} accessible={false} />}
          title="위치 권한"
          description={
            status.foregroundPermissionGranted
              ? '현재 위치와 이동 경로를 기록할 수 있어요.'
              : '기록을 시작하려면 위치 권한이 필요해요.'
          }
          status={
            <SettingsStatusBadge
              label={foregroundPermissionStatus.label}
              tone={foregroundPermissionStatus.tone}
            />
          }
          onPress={() => void openAppSettings()}
        />

        <SettingsRow
          icon={<Moon size={20} color={colors.primary} accessible={false} />}
          title="백그라운드 기록"
          description={
            backgroundPermissionReady
              ? '화면이 꺼져도 이동을 계속 기록할 수 있어요.'
              : '항상 허용 권한을 설정하면 화면이 꺼져도 기록할 수 있어요.'
          }
          status={
            <SettingsStatusBadge
              label={backgroundPermissionStatus.label}
              tone={backgroundPermissionStatus.tone}
            />
          }
          onPress={() => void openAppSettings()}
        />
      </SettingsSection>

      <SettingsSection title="저장 및 동기화">
        <SettingsRow
          icon={<Database size={20} color={colors.primary} accessible={false} />}
          title="기기 우선 저장"
          description="모든 기록은 인터넷 연결 여부와 관계없이 이 기기에 먼저 저장돼요."
          status={<SettingsStatusBadge label="사용 중" tone="success" />}
        />

        <SettingsRow
          icon={<Cloud size={20} color={colors.primary} accessible={false} />}
          title="클라우드 연결"
          description={
            status.cloudConfigured
              ? '인터넷이 연결되면 업로드 대기 중인 기록의 동기화를 시도해요.'
              : '현재는 기기 저장만 사용하고 있어요.'
          }
          status={<SettingsStatusBadge label={cloudStatus.label} tone={cloudStatus.tone} />}
        />
      </SettingsSection>

      <SettingsSection title="개인정보와 데이터">
        <SettingsRow
          icon={<ShieldCheck size={20} color={colors.primary} accessible={false} />}
          title="위치 데이터"
          description="기록을 시작한 동안에만 위치와 이동 정보를 저장해요."
        />

        <SettingsRow
          icon={<Smartphone size={20} color={colors.primary} accessible={false} />}
          title="기기 저장소"
          description="완료된 기록과 GPS 포인트는 앱의 기기 저장 공간에 안전하게 보관돼요."
        />
      </SettingsSection>

      <SettingsSection title="앱 정보">
        <SettingsRow
          icon={<Info size={20} color={colors.primary} accessible={false} />}
          title="nuni track"
          description="자전거, 산책, 러닝과 등산을 기록하는 앱"
        />
      </SettingsSection>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
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
  authBlock: {
    gap: spacing.md,
  },
  authMessage: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  authHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  signingInText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
  syncStatusBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  syncStatusTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  syncStatusValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  syncStatusHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  secondaryActionButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  dangerActionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  dangerActionButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  retryButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  actionButtonPressed: {
    opacity: 0.78,
  },
});
