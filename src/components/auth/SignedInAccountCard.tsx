import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UserRound } from 'lucide-react-native';

import type { AuthUser } from '../../auth/types';
import { colors, radius, spacing, typography } from '../../theme';

interface SignedInAccountCardProps {
  user: AuthUser;
}

export function SignedInAccountCard({ user }: SignedInAccountCardProps) {
  const initial = user.name?.trim()?.charAt(0) || user.email.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      {user.pictureUrl ? (
        <Image source={{ uri: user.pictureUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          {initial ? (
            <Text style={styles.initial}>{initial.toUpperCase()}</Text>
          ) : (
            <UserRound size={18} color={colors.textPrimary} />
          )}
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name || 'Google 사용자'}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initial: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
