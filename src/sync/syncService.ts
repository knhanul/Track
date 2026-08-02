import * as Network from 'expo-network';

import { apiFetch, API_BASE_URL } from '../api/apiClient';
import type { AuthStatus } from '../auth/types';
import {
  completeSyncQueueItem,
  failSyncQueueItem,
  getRecordUploadPayload,
  listPendingSyncItems,
  markSyncState,
} from '../database/recordRepository';

let syncing = false;
let authStatus: AuthStatus = 'signed_out';

async function uploadPendingRecords(): Promise<void> {
  if (syncing || !API_BASE_URL || authStatus !== 'signed_in') return;
  syncing = true;

  try {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return;

    const queueItems = await listPendingSyncItems();

    for (const queueItem of queueItems) {
      const nextAttempt = queueItem.attempt_count + 1;
      try {
        const payload = await getRecordUploadPayload(queueItem.entity_id);
        if (!payload) {
          await completeSyncQueueItem(queueItem.id);
          continue;
        }

        await markSyncState(queueItem.entity_id, 'syncing');

        const response = await apiFetch('/v1/life-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': queueItem.entity_id,
          },
          body: JSON.stringify(payload),
        }, { auth: true });

        if (!response.ok) {
          throw new Error(`API ${response.status}: ${await response.text()}`);
        }

        await markSyncState(queueItem.entity_id, 'synced');
        await completeSyncQueueItem(queueItem.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '알 수 없는 동기화 오류';
        await markSyncState(queueItem.entity_id, 'failed');
        await failSyncQueueItem(queueItem.id, message, nextAttempt);
      }
    }
  } finally {
    syncing = false;
  }
}

export function startNetworkSyncListener(): () => void {
  void uploadPendingRecords();

  const subscription = Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void uploadPendingRecords();
    }
  });

  return () => subscription.remove();
}

export function setSyncAuthStatus(status: AuthStatus): void {
  authStatus = status;
  if (status === 'signed_in') {
    void uploadPendingRecords();
  }
}

export function triggerSyncNow(): void {
  void uploadPendingRecords();
}
