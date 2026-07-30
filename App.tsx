import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomTabs, type TabKey } from './src/components/BottomTabs';
import { initializeDatabase } from './src/database/database';
import { useRecorder } from './src/features/recording/useRecorder';
import { RecordStartScreen } from './src/screens/RecordStartScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { startNetworkSyncListener } from './src/sync/syncService';
import { colors, spacing, typography } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [recordStartOpen, setRecordStartOpen] = useState(false);
  const [todayRefreshSignal, setTodayRefreshSignal] = useState(0);
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

  useEffect(() => {
    if (!recordStartOpen || recorder.activeRecordId) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setRecordStartOpen(false);
      return true;
    });

    return () => subscription.remove();
  }, [recordStartOpen, recorder.activeRecordId]);

  function handleRecordingCompleted() {
    setRecordStartOpen(false);
    setActiveTab('today');
    setTodayRefreshSignal((previous) => previous + 1);
  }

  function handleSelectTab(tab: TabKey) {
    setRecordStartOpen(false);
    setActiveTab(tab);
  }

  function handleOpenRecord() {
    setRecordStartOpen(true);
  }

  const content = useMemo(() => {
    if (recorder.activeRecordId) {
      return (
        <RecordingScreen
          recorder={recorder}
          onCompleted={handleRecordingCompleted}
        />
      );
    }

    if (recordStartOpen) {
      return <RecordStartScreen recorder={recorder} />;
    }

    switch (activeTab) {
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'today':
      default:
        return (
          <TodayScreen
            recorder={recorder}
            onOpenRecord={handleOpenRecord}
            refreshSignal={todayRefreshSignal}
          />
        );
    }
  }, [
    activeTab,
    handleRecordingCompleted,
    recordStartOpen,
    recorder,
    todayRefreshSignal,
  ]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>기록 저장소를 준비하고 있어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>{content}</View>
      {!recorder.activeRecordId && (
        <BottomTabs
          activeTab={activeTab}
          recordStartActive={recordStartOpen}
          onSelectTab={handleSelectTab}
          onPressRecord={handleOpenRecord}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
