import { apiFetch, apiFetchJson } from '../api/apiClient';

export interface ServerActivityPayload {
  clientId: string;
  activityType: string;
  startedAt: string;
  endedAt: string | null;
  distanceM: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  elevationGainM: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  title: string;
  note: string | null;
}

export interface ServerActivityResponse {
  id: string;
  userId?: string;
  clientId: string;
  activityType: string;
  startedAt: string;
  endedAt: string | null;
  distanceM: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  elevationGainM: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  title: string;
  note: string | null;
  createdAt?: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServerTrackPointPayload {
  seqNo: number;
  recordedAt: string;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  accuracyM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
}

export interface ServerSyncChange {
  id: number;
  entityType: 'activity' | 'device' | string;
  entityId: string;
  operation: 'upsert' | 'delete' | string;
}

export interface ServerSyncChangesResponse {
  changes: ServerSyncChange[];
}

export interface ServerSyncState {
  deviceId?: string;
  lastChangeId?: number;
  lastPushAt?: string | null;
  lastPullAt?: string | null;
  lastSuccessAt?: string | null;
}

export interface ServerDeviceRegistrationPayload {
  clientDeviceId: string;
  platform: 'android' | 'ios';
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  osVersion: string;
  appVersion: string;
}

export interface ServerDeviceRegistrationResponse {
  id: string;
  clientDeviceId: string;
  platform: 'android' | 'ios';
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  osVersion: string;
  appVersion: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function registerDevice(payload: ServerDeviceRegistrationPayload): Promise<ServerDeviceRegistrationResponse> {
  return apiFetchJson<ServerDeviceRegistrationResponse>('/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true, retryOnUnauthorized: true });
}

export async function createActivity(payload: ServerActivityPayload): Promise<ServerActivityResponse> {
  return apiFetchJson<ServerActivityResponse>('/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.clientId,
    },
    body: JSON.stringify(payload),
  }, { auth: true, retryOnUnauthorized: true });
}

export async function uploadTrackPoints(serverActivityId: string, points: ServerTrackPointPayload[]): Promise<void> {
  await apiFetchJson<null>(`/activities/${serverActivityId}/track-points/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  }, { auth: true, retryOnUnauthorized: true });
}

export async function fetchActivity(serverActivityId: string): Promise<ServerActivityResponse> {
  return apiFetchJson<ServerActivityResponse>(`/activities/${serverActivityId}`, {}, { auth: true, retryOnUnauthorized: true });
}

export async function fetchActivityTrackPoints(serverActivityId: string): Promise<ServerTrackPointPayload[]> {
  const response = await apiFetchJson<{ points?: ServerTrackPointPayload[]; trackPoints?: ServerTrackPointPayload[] }>(`/activities/${serverActivityId}/track-points`, {}, { auth: true, retryOnUnauthorized: true });
  return response.points ?? response.trackPoints ?? [];
}

export async function deleteActivity(serverActivityId: string): Promise<void> {
  await apiFetchJson<null>(`/activities/${serverActivityId}`, {
    method: 'DELETE',
  }, { auth: true, retryOnUnauthorized: true });
}

export async function fetchSyncChanges(after: number, limit = 200): Promise<ServerSyncChangesResponse> {
  return apiFetchJson<ServerSyncChangesResponse>(`/sync/changes?after=${after}&limit=${limit}`, {}, { auth: true, retryOnUnauthorized: true });
}

export async function fetchSyncState(): Promise<ServerSyncState> {
  return apiFetchJson<ServerSyncState>('/sync/state', {}, { auth: true, retryOnUnauthorized: true });
}

export async function updateSyncState(payload: ServerSyncState): Promise<ServerSyncState> {
  return apiFetchJson<ServerSyncState>('/sync/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true, retryOnUnauthorized: true });
}
