import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import type { RecorderController } from '../domain/models';

interface Props {
  recorder: RecorderController;
  autoFocusStart?: boolean;
}

const FEATURES = [
  {
    icon: '􀋮',
    fallbackIcon: '📍',
    title: '오프라인 우선 저장',
    subtitle: '인터넷이 없어도 기기에 먼저 저장돼요',
  },
  {
    icon: '􀆨',
    fallbackIcon: '🌙',
    title: '백그라운드 기록',
    subtitle: '화면이 꺼져도 이동 경로를 계속 기록해요',
  },
  {
    icon: '􀌌',
    fallbackIcon: '☁️',
    title: '자동 클라우드 동기화',
    subtitle: '연결이 복구되면 자동으로 업로드돼요',
  },
];

export function HomeScreen({ recorder, autoFocusStart = false }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.largeTitle}>기록</Text>
      <Text style={styles.subtitle}>
        속도, 거리, 시간, 고도의 변화를{`\n`}하나의 일상 기록으로 남겨요.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroRing}>
          <View style={styles.heroRingInner}>
            <Text style={styles.heroIcon}>📍</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>기록 준비 완료</Text>
        <Text style={styles.heroCaption}>GPS 위치를 확인한 뒤 시작합니다</Text>

        {recorder.error ? (
          <Text style={styles.error}>{recorder.error}</Text>
        ) : null}

        <ActionButton
          label={autoFocusStart ? '지금 기록 시작' : '일상 기록 시작'}
          onPress={() => void recorder.start()}
          loading={recorder.busy}
          style={styles.startButton}
        />
      </View>

      <Text style={styles.sectionHeader}>이렇게 기록돼요</Text>
      <View style={styles.insetGroup}>
        {FEATURES.map((feature, index) => (
          <View key={feature.title}>
            {index > 0 && <View style={styles.separator} />}
            <View style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Text style={styles.rowIcon}>{feature.fallbackIcon}</Text>
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{feature.title}</Text>
                <Text style={styles.rowSubtitle}>{feature.subtitle}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        백그라운드 위치 기록은 Expo Go가 아니라 Android/iOS 개발 빌드에서
        확인해야 합니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  largeTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
    marginTop: 12,
  },
  subtitle: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  heroCard: {
    marginTop: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(118,118,128,0.12)',
    alignItems: 'center',
  },
  heroRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: 'rgba(48,209,88,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(48,209,88,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 38,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.45,
    marginTop: 20,
  },
  heroCaption: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },
  startButton: {
    alignSelf: 'stretch',
    borderRadius: 28,
    minHeight: 54,
  },
  sectionHeader: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 8,
    marginLeft: 16,
  },
  insetGroup: {
    borderRadius: 16,
    backgroundColor: 'rgba(118,118,128,0.12)',
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(84,84,88,0.65)',
    marginLeft: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(48,209,88,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: {
    fontSize: 16,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  rowSubtitle: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  error: {
    color: '#FF453A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  footnote: {
    color: 'rgba(235,235,245,0.3)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
