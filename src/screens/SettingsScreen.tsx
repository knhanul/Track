import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { API_BASE_URL } from '../sync/syncService';
import { colors, radius, spacing, typography } from '../theme';

export function SettingsScreen() {
  const apiConfigured = Boolean(API_BASE_URL);

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Text style={styles.eyebrow}>PROFILE</Text>
      <Text style={styles.title}>나</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>오프라인 우선 저장</Text>
        <Text style={styles.body}>
          모든 위치 기록은 서버보다 스마트폰 SQLite에 먼저 저장됩니다. 앱을
          다시 실행해도 완료된 기록과 업로드 대기 상태가 남습니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>클라우드 API</Text>
        <Text style={[styles.body, !apiConfigured && styles.warningText]}>
          {API_BASE_URL
            ? API_BASE_URL
            : '아직 설정되지 않았습니다. .env의 EXPO_PUBLIC_API_BASE_URL을 입력하세요.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>다음 구현 대상</Text>
        <Text style={styles.body}>
          Google·Apple 로그인, 사진과 음성 순간, PostgreSQL/PostGIS API,
          오프라인 지도, GPX 가져오기·내보내기입니다.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {},
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  warningText: {
    color: colors.warning,
  },
});
