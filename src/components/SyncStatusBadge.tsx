import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatSyncStatus } from '../domain/format';
import type { SyncStatus } from '../domain/models';
import { colors, typography } from '../theme';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  compact?: boolean;
}

export function SyncStatusBadge({ status, compact = false }: SyncStatusBadgeProps) {
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="clip"
      style={[styles.base, compact && styles.compact, { color: getStatusColor(status) }]}
    >
      {formatSyncStatus(status)}
    </Text>
  );
}

function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'pending':
    case 'pending_create':
    case 'pending_update':
    case 'pending_delete':
      return colors.warning;
    case 'syncing':
      return colors.primary;
    case 'synced':
      return colors.success;
    case 'failed':
    case 'sync_error':
      return colors.danger;
    case 'local_only':
    default:
      return colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  base: {
    ...typography.caption,
    fontWeight: '700',
  },
  compact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
