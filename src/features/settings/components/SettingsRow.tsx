import React, { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../theme';

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description?: string;
  status?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function SettingsRow({
  icon,
  title,
  description,
  status,
  onPress,
  disabled = false,
  accessibilityLabel,
}: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.iconWrap}>{icon}</View>

      <View style={styles.textWrap}>
        <View style={styles.headerRow}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
            {title}
          </Text>
          {status ? <View style={styles.statusWrap}>{status}</View> : null}
        </View>

        {description ? (
          <Text numberOfLines={2} style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>

      {onPress ? <ChevronRight size={18} color={colors.textMuted} accessible={false} /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.row, disabled && styles.disabled]}
        accessibilityLabel={accessibilityLabel}
        accessible
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="스마트폰 앱 설정을 엽니다"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  statusWrap: {
    flexShrink: 0,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
