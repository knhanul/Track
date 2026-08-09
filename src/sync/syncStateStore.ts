import { getDatabase } from '../database/database';

const LAST_CHANGE_ID_KEY = 'sync_last_change_id';
const LAST_PUSH_AT_KEY = 'sync_last_push_at';
const LAST_PULL_AT_KEY = 'sync_last_pull_at';
const LAST_SUCCESS_AT_KEY = 'sync_last_success_at';
const LAST_ERROR_CODE_KEY = 'sync_last_error_code';
const LAST_ERROR_MESSAGE_KEY = 'sync_last_error_message';
const SERVER_DEVICE_ID_KEY = 'sync_server_device_id';

export interface LocalSyncState {
  serverDeviceId: string | null;
  lastChangeId: number;
  lastPushAt: number | null;
  lastPullAt: number | null;
  lastSuccessAt: number | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    key,
  );
  return row?.value ?? null;
}

async function setSetting(key: string, value: string | null): Promise<void> {
  const db = await getDatabase();
  if (value === null) {
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, key);
    return;
  }

  await db.runAsync(
    `INSERT INTO app_settings(key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function loadLocalSyncState(): Promise<LocalSyncState> {
  const [serverDeviceId, lastChangeId, lastPushAt, lastPullAt, lastSuccessAt, lastErrorCode, lastErrorMessage] = await Promise.all([
    getSetting(SERVER_DEVICE_ID_KEY),
    getSetting(LAST_CHANGE_ID_KEY),
    getSetting(LAST_PUSH_AT_KEY),
    getSetting(LAST_PULL_AT_KEY),
    getSetting(LAST_SUCCESS_AT_KEY),
    getSetting(LAST_ERROR_CODE_KEY),
    getSetting(LAST_ERROR_MESSAGE_KEY),
  ]);

  return {
    serverDeviceId,
    lastChangeId: Number(lastChangeId ?? 0) || 0,
    lastPushAt: parseNullableNumber(lastPushAt),
    lastPullAt: parseNullableNumber(lastPullAt),
    lastSuccessAt: parseNullableNumber(lastSuccessAt),
    lastErrorCode,
    lastErrorMessage,
  };
}

export async function updateLocalSyncState(patch: Partial<LocalSyncState>): Promise<void> {
  const updates: Array<Promise<void>> = [];

  if ('serverDeviceId' in patch) updates.push(setSetting(SERVER_DEVICE_ID_KEY, patch.serverDeviceId ?? null));
  if ('lastChangeId' in patch) updates.push(setSetting(LAST_CHANGE_ID_KEY, patch.lastChangeId === undefined ? null : String(patch.lastChangeId)));
  if ('lastPushAt' in patch) updates.push(setSetting(LAST_PUSH_AT_KEY, patch.lastPushAt === undefined || patch.lastPushAt === null ? null : String(patch.lastPushAt)));
  if ('lastPullAt' in patch) updates.push(setSetting(LAST_PULL_AT_KEY, patch.lastPullAt === undefined || patch.lastPullAt === null ? null : String(patch.lastPullAt)));
  if ('lastSuccessAt' in patch) updates.push(setSetting(LAST_SUCCESS_AT_KEY, patch.lastSuccessAt === undefined || patch.lastSuccessAt === null ? null : String(patch.lastSuccessAt)));
  if ('lastErrorCode' in patch) updates.push(setSetting(LAST_ERROR_CODE_KEY, patch.lastErrorCode ?? null));
  if ('lastErrorMessage' in patch) updates.push(setSetting(LAST_ERROR_MESSAGE_KEY, patch.lastErrorMessage ?? null));

  await Promise.all(updates);
}

export async function clearSyncError(): Promise<void> {
  await Promise.all([
    setSetting(LAST_ERROR_CODE_KEY, null),
    setSetting(LAST_ERROR_MESSAGE_KEY, null),
  ]);
}

function parseNullableNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
