import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BottomTabs, type TabKey } from './src/components/BottomTabs';
import { initializeDatabase } from './src/database/database';
import { useRecorder } from './src/features/recording/useRecorder';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { startNetworkSyncListener } from './src/sync/syncService';

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>('today');
  const recorder = useRecorder();

  useEffect(() => {
    let unsubscribe: undefined | (() => void);

    void (async () => {
      await initializeDatabase();
      await recorder.restore();
      unsubscribe = startNetworkSyncListener();
      setReady(true);
    })();

    return () => unsubscribe?.();
  }, []);

  const content = useMemo(() => {
    if (recorder.activeRecordId) {
      return <RecordingScreen recorder={recorder} />;
    }

    switch (tab) {
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'record':
        return <HomeScreen recorder={recorder} autoFocusStart />;
      case 'today':
      default:
        return <HomeScreen recorder={recorder} />;
    }
  }, [recorder, tab]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>기록 저장소를 준비하고 있어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>{content}</View>
      {!recorder.activeRecordId && <BottomTabs active={tab} onChange={setTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  content: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#000000',
  },
  loadingText: { color: 'rgba(235,235,245,0.6)', fontSize: 15 },
});
