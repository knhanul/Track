import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface GoogleSignInButtonProps {
  onPress(): void;
  disabled?: boolean;
  loading?: boolean;
}

export function GoogleSignInButton({ onPress, disabled = false, loading = false }: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Google로 로그인"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#1f1f1f" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.glyph}>G</Text>
          <Text style={styles.label}>Google로 로그인</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d5d7dc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  glyph: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: '#1f1f1f',
  },
  label: {
    ...typography.bodyStrong,
    color: '#1f1f1f',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
