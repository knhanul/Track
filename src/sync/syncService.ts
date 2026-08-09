import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { API_BASE_URL } from '../api/apiClient';
import type { AuthStatus } from '../auth/types';
import {
  completeSyncQueueItem,
  failSyncQueueItem,
  getLifeRecordByLocalId,
  getLifeRecordByServerId,
  getRecordUploadPayload,
  listPendingSyncItems,
  markRecordServerSynced,
  markRecordSoftDeleted,
  markSyncState,
  upsertRemoteActivitySnapshot,
} from '../database/recordRepository';
import type { LiveMetrics } from '../domain/models';
import { buildDeviceRegistrationPayload } from './deviceIdentity';
import {
  createActivity,
  fetchActivity,
  fetchActivityTrackPoints,
  fetchSyncChanges,
  registerDevice,
  uploadTrackPoints,
  updateSyncState,
} from './syncApi';
import {
  clearSyncError,
  loadLocalSyncState,
  updateLocalSyncState,
} from './syncStateStore';

let authStatus: AuthStatus = 'signed_out';
let syncRunner: Promise<void> | null = null;
let networkSubscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;
let appStateSubscription: { remove(): void } | null = null;

function isPendingSyncStatus(syncStatus: LiveMetrics['syncStatus']): boolean {
  return (
    syncStatus === 'pending' ||
    syncStatus === 'pending_create' ||
    syncStatus === 'pending_update' ||
    syncStatus === 'pending_delete' ||
    syncStatus === 'syncing' ||
    syncStatus === 'failed' ||
    syncStatus === 'sync_error'
  );
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toIsoString(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined) return null;
  const date = new Date(ms);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

async function ensureClientDeviceRegistered(): Promise<string | null> {
  const localState = await loadLocalSyncState();
  if (localState.serverDeviceId) {
    return localState.serverDeviceId;
  }

  const payload = await buildDeviceRegistrationPayload(getAppVersion());
  const response = await registerDevice(payload);
  await updateLocalSyncState({ serverDeviceId: response.id });
  return response.id;
}

async function pushPendingActivities(): Promise<void> {
  const queueItems = await listPendingSyncItems();

  for (const queueItem of queueItems) {
    const nextAttempt = queueItem.attempt_count + 1;

    if (queueItem.operation === 'activity_delete') {
      const payload = await getRecordUploadPayload(queueItem.entity_id);
      const serverId = payload?.record.serverId ?? null;

      if (!serverId) {
        await completeSyncQueueItem(queueItem.id);
        continue;
      }

      try {
        await markSyncState(queueItem.entity_id, 'syncing');
        // Delete endpoint is not invoked yet because the local UI currently does not
        // expose activity deletion. Keep the queue item safe for future delete flows.
        await markSyncState(queueItem.entity_id, 'pending_delete');
        await failSyncQueueItem(queueItem.id, 'delete sync is not yet wired from UI', nextAttempt);
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 동기화 오류';
        await markSyncState(queueItem.entity_id, 'sync_error');
        await failSyncQueueItem(queueItem.id, message, nextAttempt);
      }
      continue;
    }

    try {
      const payload = await getRecordUploadPayload(queueItem.entity_id);
      if (!payload) {
        await completeSyncQueueItem(queueItem.id);
        continue;
      }

      const { points, record } = payload;
      await markSyncState(record.id, 'syncing');

      const activityResponse = await createActivity({
        clientId: record.id,
        activityType: record.activityType,
        startedAt: toIsoString(record.startedAtMs) ?? new Date(record.startedAtMs).toISOString(),
        endedAt: toIsoString(record.endedAtMs),
        distanceM: record.distanceM,
        movingTimeSec: Math.round(record.movingMs / 1000),
        elapsedTimeSec: Math.round(record.elapsedMs / 1000),
        elevationGainM: record.elevationGainM,
        averageSpeedMps: record.averageSpeedKph / 3.6,
        maxSpeedMps: record.maxSpeedKph / 3.6,
        title: record.title,
        note: record.note,
      });

      if (points.length > 0) {
        const pointBatches = chunkArray(points, 1000);
        for (const batch of pointBatches) {
          await uploadTrackPoints(
            activityResponse.id,
            batch.map((point) => ({
              seqNo: point.sequence_no,
              recordedAt: toIsoString(point.recorded_at_ms) ?? new Date(point.recorded_at_ms).toISOString(),
              latitude: point.latitude,
              longitude: point.longitude,
              altitudeM: point.altitude_m ?? null,
              accuracyM: point.accuracy_m ?? null,
              speedMps: point.speed_mps ?? null,
              headingDeg: point.heading ?? null,
            })),
          );
        }
      }

      await markRecordServerSynced(record.id, activityResponse.id, Date.parse(activityResponse.updatedAt) || Date.now());
      await markSyncState(record.id, 'synced');
      await completeSyncQueueItem(queueItem.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 동기화 오류';
      await markSyncState(queueItem.entity_id, 'sync_error');
      await failSyncQueueItem(queueItem.id, message, nextAttempt);
    }
  }
}

async function pullRemoteChanges(): Promise<void> {
  const syncState = await loadLocalSyncState();
  let nextChangeId = syncState.lastChangeId;
  let changed = false;

  for (let attempts = 0; attempts < 50; attempts += 1) {
    const response = await fetchSyncChanges(nextChangeId, 200);
    const changes = response.changes ?? [];
    if (changes.length === 0) break;

    for (const change of changes) {
      nextChangeId = Math.max(nextChangeId, change.id);
      if (change.entityType !== 'activity') continue;

      if (change.operation === 'delete') {
        const localRecord = await getLifeRecordByServerId(change.entityId);
        if (localRecord && !isPendingSyncStatus(localRecord.sync_status)) {
          await markRecordSoftDeleted(localRecord.id, 'synced');
          changed = true;
        }
        continue;
      }

      const remoteActivity = await fetchActivity(change.entityId);
      const remotePoints = await fetchActivityTrackPoints(change.entityId);
      const localRecord =
        (remoteActivity.clientId ? await getLifeRecordByLocalId(remoteActivity.clientId) : null) ??
        (await getLifeRecordByServerId(remoteActivity.id));

      if (localRecord && isPendingSyncStatus(localRecord.sync_status) && localRecord.server_id === remoteActivity.id) {
        continue;
      }

      await upsertRemoteActivitySnapshot(
        {
          id: remoteActivity.id,
          clientId: remoteActivity.clientId,
          activityType: remoteActivity.activityType,
          startedAt: remoteActivity.startedAt,
          endedAt: remoteActivity.endedAt,
          distanceM: remoteActivity.distanceM,
          movingTimeSec: remoteActivity.movingTimeSec,
          elapsedTimeSec: remoteActivity.elapsedTimeSec,
          elevationGainM: remoteActivity.elevationGainM,
          averageSpeedMps: remoteActivity.averageSpeedMps,
          maxSpeedMps: remoteActivity.maxSpeedMps,
          title: remoteActivity.title,
          note: remoteActivity.note,
          updatedAt: remoteActivity.updatedAt,
          deletedAt: remoteActivity.deletedAt,
        },
        remotePoints,
      );
      changed = true;
    }

    if (changes.length < 200) break;
  }

  if (changed || nextChangeId !== syncState.lastChangeId) {
    await updateLocalSyncState({
      lastChangeId: nextChangeId,
      lastPullAt: Date.now(),
      lastSuccessAt: Date.now(),
      lastErrorCode: null,
      lastErrorMessage: null,
    });

    await clearSyncError();
    await updateSyncState({
      deviceId: syncState.serverDeviceId ?? undefined,
      lastChangeId: nextChangeId,
      lastPullAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
    }).catch(() => undefined);
  }
}

async function runSyncCycle(): Promise<void> {
  if (syncRunner || !API_BASE_URL || authStatus !== 'signed_in') return;

  syncRunner = (async () => {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return;

    const serverDeviceId = await ensureClientDeviceRegistered();
    await pushPendingActivities();
    await pullRemoteChanges();

    await updateLocalSyncState({
      serverDeviceId,
      lastSuccessAt: Date.now(),
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  })().catch(async (error) => {
    const message = error instanceof Error ? error.message : '알 수 없는 동기화 오류';
    await updateLocalSyncState({
      lastErrorCode: 'sync_cycle_failed',
      lastErrorMessage: message,
    });
  }).finally(() => {
    syncRunner = null;
  });

  await syncRunner;
}

export function startNetworkSyncListener(): () => void {
  void runSyncCycle();

  networkSubscription = Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void runSyncCycle();
    }
  });

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void runSyncCycle();
    }
  });

  return () => {
    networkSubscription?.remove();
    networkSubscription = null;
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}

export function setSyncAuthStatus(status: AuthStatus): void {
  authStatus = status;
  if (status === 'signed_in') {
    void runSyncCycle();
  }
}

export function triggerSyncNow(): void {
  void runSyncCycle();
}
