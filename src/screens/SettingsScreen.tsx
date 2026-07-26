import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '../sync/syncService';

export function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.body}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  eyebrow: {
    color: '#58E2D2',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 12,
  },
  title: {
    color: '#F5FAFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },
  section: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: '#101E31',
    borderWidth: 1,
    borderColor: '#1A304A',
  },
  sectionTitle: { color: '#EEF7FF', fontSize: 16, fontWeight: '800' },
  body: { color: '#91A4BA', fontSize: 14, lineHeight: 22, marginTop: 9 },
});
