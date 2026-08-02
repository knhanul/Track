import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CloudUpload, Database, Moon } from 'lucide-react-native';

import { colors, radius, spacing, typography } from '../../../theme';

interface RecordingStorageInfoRowProps {
  compact?: boolean;
}

export function RecordingStorageInfoRow({ compact: _compact = true }: RecordingStorageInfoRowProps) {
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => setInfoVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="기록 저장 방식 안내 보기"
      >
        <Text style={styles.text} numberOfLines={1}>
          기기 저장 · 화면 꺼짐 기록 · 자동 동기화
        </Text>
        <Text style={styles.infoButton}>ⓘ</Text>
      </Pressable>

      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setInfoVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>기록 저장 방식</Text>

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Database size={16} color={colors.primary} accessible={false} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>기기에 먼저 저장</Text>
                <Text style={styles.detailDescription}>인터넷이 없어도 기록이 남아요.</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Moon size={16} color={colors.primary} accessible={false} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>백그라운드 기록</Text>
                <Text style={styles.detailDescription}>화면이 꺼져도 진행 중인 활동을 계속 기록해요.</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <CloudUpload size={16} color={colors.primary} accessible={false} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>자동 동기화</Text>
                <Text style={styles.detailDescription}>인터넷이 연결되면 클라우드 업로드를 시도해요.</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.closeText}>확인</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
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
  pressed: {
    opacity: 0.75,
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
    gap: spacing.md,
  },
  sheetTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  detailItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  detailTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  detailDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeButton: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  closeText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
