import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, CloudUpload } from 'lucide-react-native';

import { colors, radius, spacing, typography } from '../../../theme';

interface TodaySyncStatusRowProps {
  pendingSyncCount: number;
}

export function TodaySyncStatusRow({ pendingSyncCount }: TodaySyncStatusRowProps) {
  const [modalVisible, setModalVisible] = useState(false);

  if (pendingSyncCount === 0) return null;

  const label = `업로드 대기 ${pendingSyncCount}건`;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="업로드 대기 중인 활동 정보를 확인합니다"
      >
        <View style={styles.left}>
          <CloudUpload size={16} color={colors.primary} accessible={false} />
          <Text style={styles.text} numberOfLines={1}>{label}</Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} accessible={false} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>클라우드 업로드 대기</Text>
            <Text style={styles.sheetDescription}>
              인터넷 연결을 확인한 뒤 자동으로 다시 시도합니다.
            </Text>

            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>대기 중인 활동</Text>
              <Text style={styles.sheetRowValue}>{pendingSyncCount}건</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>닫기</Text>
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
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  text: {
    ...typography.caption,
    color: colors.textPrimary,
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
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  sheetDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginTop: spacing.xs,
  },
  sheetRowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sheetRowValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
