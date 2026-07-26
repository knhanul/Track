import * as Network from 'expo-network';

import {
  completeSyncQueueItem,
  failSyncQueueItem,
  getRecordUploadPayload,
  listPendingSyncItems,
  markSyncState,
} from '../database/recordRepository';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

let syncing = false;

async function uploadPendingRecords(): Promise<void> {
  if (syncing || !API_BASE_URL) return;
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

        const response = await fetch(`${API_BASE_URL}/v1/life-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': queueItem.entity_id,
          },
          body: JSON.stringify(payload),
        });

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
