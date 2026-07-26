import * as Crypto from 'expo-crypto';
import type { LocationObject } from 'expo-location';

import { calculateSpeedKph, haversineDistanceM, sanitizeNumber } from '../domain/geo';
import type {
  LifeRecordSummary,
  LiveMetrics,
  RecordStatus,
  SyncStatus,
} from '../domain/models';
import { getDatabase } from './database';

const ACTIVE_RECORD_KEY = 'active_record_id';
const MAX_ACCEPTED_ACCURACY_M = 80;
const MAX_REASONABLE_SPEED_KPH = 180;
const MOVING_THRESHOLD_KPH = 1;

interface RecordRow {
  id: string;
  title: string;
  status: RecordStatus;
  started_at_ms: number;
  ended_at_ms: number | null;
  elapsed_ms: number;
  moving_ms: number;
  rest_ms: number;
  distance_m: number;
  current_speed_kph: number;
  average_speed_kph: number;
  max_speed_kph: number;
  elevation_gain_m: number;
  point_count: number;
  sync_status: SyncStatus;
}

interface LastPointRow {
  sequence_no: number;
  recorded_at_ms: number;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
}

function rowToMetrics(row: RecordRow, nowMs = Date.now()): LiveMetrics {
  const elapsedMs =
    row.status === 'completed'
      ? row.elapsed_ms
      : Math.max(row.elapsed_ms, nowMs - row.started_at_ms);
  const restMs = Math.max(row.rest_ms, elapsedMs - row.moving_ms);

  return {
    recordId: row.id,
    status: row.status,
    startedAtMs: row.started_at_ms,
    elapsedMs,
    movingMs: row.moving_ms,
    restMs,
    distanceM: row.distance_m,
    currentSpeedKph: row.status === 'recording' ? row.current_speed_kph : 0,
    averageSpeedKph: row.average_speed_kph,
    maxSpeedKph: row.max_speed_kph,
    elevationGainM: row.elevation_gain_m,
    pointCount: row.point_count,
    syncStatus: row.sync_status,
  };
}

export async function createLifeRecord(): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  const dateTitle = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(now));

  await db.runAsync(
    `INSERT INTO life_records (
      id, title, status, started_at_ms, created_at_ms, updated_at_ms
    ) VALUES (?, ?, 'recording', ?, ?, ?)`,
    id,
    `${dateTitle}의 기록`,
    now,
    now,
    now,
  );

  await setActiveRecordId(id);
  return id;
}

export async function setActiveRecordId(recordId: string | null): Promise<void> {
  const db = await getDatabase();
  if (recordId === null) {
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, ACTIVE_RECORD_KEY);
    return;
  }

  await db.runAsync(
    `INSERT INTO app_settings(key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ACTIVE_RECORD_KEY,
    recordId,
  );
}

export async function getActiveRecordId(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    ACTIVE_RECORD_KEY,
  );
  return row?.value ?? null;
}

export async function updateRecordStatus(
  recordId: string,
  status: RecordStatus,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE life_records
     SET status = ?, current_speed_kph = 0, updated_at_ms = ?
     WHERE id = ?`,
    status,
    Date.now(),
    recordId,
  );
}

export async function getLiveMetrics(recordId: string): Promise<LiveMetrics | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RecordRow>(
    `SELECT * FROM life_records WHERE id = ?`,
    recordId,
  );
  return row ? rowToMetrics(row) : null;
}

export async function appendLocationBatch(
  recordId: string,
  locations: LocationObject[],
): Promise<void> {
  if (locations.length === 0) return;

  const db = await getDatabase();
  const record = await db.getFirstAsync<RecordRow>(
    `SELECT * FROM life_records WHERE id = ?`,
    recordId,
  );
  if (!record || record.status !== 'recording') return;

  let lastPoint = await db.getFirstAsync<LastPointRow>(
    `SELECT sequence_no, recorded_at_ms, latitude, longitude, altitude_m
     FROM track_points
     WHERE record_id = ?
     ORDER BY sequence_no DESC
     LIMIT 1`,
    recordId,
  );

  let distanceM = record.distance_m;
  let movingMs = record.moving_ms;
  let maxSpeedKph = record.max_speed_kph;
  let currentSpeedKph = record.current_speed_kph;
  let elevationGainM = record.elevation_gain_m;
  let pointCount = record.point_count;
  let nextSequence = (lastPoint?.sequence_no ?? -1) + 1;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const location of [...locations].sort((a, b) => a.timestamp - b.timestamp)) {
      const accuracyM = sanitizeNumber(location.coords.accuracy);
      if (accuracyM !== null && accuracyM > MAX_ACCEPTED_ACCURACY_M) continue;
      if (lastPoint && location.timestamp <= lastPoint.recorded_at_ms) continue;

      let segmentDistanceM = 0;
      let deltaMs = 0;
      let calculatedSpeedKph = 0;

      if (lastPoint) {
        deltaMs = location.timestamp - lastPoint.recorded_at_ms;
        segmentDistanceM = haversineDistanceM(
          { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        );
        calculatedSpeedKph = calculateSpeedKph(segmentDistanceM, deltaMs);
        if (calculatedSpeedKph > MAX_REASONABLE_SPEED_KPH) continue;
      }

      const nativeSpeedMps = sanitizeNumber(location.coords.speed);
      currentSpeedKph =
        nativeSpeedMps !== null && nativeSpeedMps >= 0
          ? nativeSpeedMps * 3.6
          : calculatedSpeedKph;

      if (lastPoint && deltaMs > 0) {
        distanceM += segmentDistanceM;
        if (currentSpeedKph >= MOVING_THRESHOLD_KPH) movingMs += deltaMs;
      }

      const altitudeM = sanitizeNumber(location.coords.altitude);
      if (
        lastPoint?.altitude_m !== null &&
        lastPoint?.altitude_m !== undefined &&
        altitudeM !== null
      ) {
        const altitudeDelta = altitudeM - lastPoint.altitude_m;
        if (altitudeDelta >= 1) elevationGainM += altitudeDelta;
      }

      maxSpeedKph = Math.max(maxSpeedKph, currentSpeedKph);
      const pointId = Crypto.randomUUID();

      const result = await transaction.runAsync(
        `INSERT OR IGNORE INTO track_points (
          id, record_id, sequence_no, recorded_at_ms, latitude, longitude,
          altitude_m, accuracy_m, speed_mps, heading
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        pointId,
        recordId,
        nextSequence,
        location.timestamp,
        location.coords.latitude,
        location.coords.longitude,
        altitudeM,
        accuracyM,
        nativeSpeedMps,
        sanitizeNumber(location.coords.heading),
      );

      if (result.changes > 0) {
        pointCount += 1;
        lastPoint = {
          sequence_no: nextSequence,
          recorded_at_ms: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude_m: altitudeM,
        };
        nextSequence += 1;
      }
    }

    const elapsedMs = Math.max(0, Date.now() - record.started_at_ms);
    const restMs = Math.max(0, elapsedMs - movingMs);
    const averageSpeedKph =
      movingMs > 0 ? (distanceM / (movingMs / 1000)) * 3.6 : 0;

    await transaction.runAsync(
      `UPDATE life_records SET
        elapsed_ms = ?, moving_ms = ?, rest_ms = ?, distance_m = ?,
        current_speed_kph = ?, average_speed_kph = ?, max_speed_kph = ?,
        elevation_gain_m = ?, point_count = ?, updated_at_ms = ?
       WHERE id = ?`,
      elapsedMs,
      movingMs,
      restMs,
      distanceM,
      currentSpeedKph,
      averageSpeedKph,
      maxSpeedKph,
      elevationGainM,
      pointCount,
      Date.now(),
      recordId,
    );
  });
}

export async function completeLifeRecord(recordId: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  const record = await db.getFirstAsync<RecordRow>(
    `SELECT * FROM life_records WHERE id = ?`,
    recordId,
  );
  if (!record) return;

  const elapsedMs = Math.max(0, now - record.started_at_ms);
  const restMs = Math.max(0, elapsedMs - record.moving_ms);
  const queueId = Crypto.randomUUID();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `UPDATE life_records SET
        status = 'completed', ended_at_ms = ?, elapsed_ms = ?, rest_ms = ?,
        current_speed_kph = 0, sync_status = 'pending', updated_at_ms = ?
       WHERE id = ?`,
      now,
      elapsedMs,
      restMs,
      now,
      recordId,
    );

    await transaction.runAsync(
      `INSERT INTO sync_queue (
        id, entity_type, entity_id, operation, created_at_ms
       ) VALUES (?, 'life_record', ?, 'upsert', ?)`,
      queueId,
      recordId,
      now,
    );

    await transaction.runAsync(
      `DELETE FROM app_settings WHERE key = ?`,
      ACTIVE_RECORD_KEY,
    );
  });
}

export async function listLifeRecords(limit = 50): Promise<LifeRecordSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RecordRow>(
    `SELECT * FROM life_records ORDER BY started_at_ms DESC LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    ...rowToMetrics(row, row.ended_at_ms ?? Date.now()),
    title: row.title,
    endedAtMs: row.ended_at_ms,
  }));
}

export async function getRecordUploadPayload(recordId: string) {
  const db = await getDatabase();
  const record = await db.getFirstAsync<RecordRow>(
    `SELECT * FROM life_records WHERE id = ?`,
    recordId,
  );
  const points = await db.getAllAsync(
    `SELECT id, sequence_no, recorded_at_ms, latitude, longitude,
      altitude_m, accuracy_m, speed_mps, heading
     FROM track_points WHERE record_id = ? ORDER BY sequence_no`,
    recordId,
  );
  return record ? { record, points } : null;
}

export async function markSyncState(
  recordId: string,
  state: SyncStatus,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE life_records SET sync_status = ?, updated_at_ms = ? WHERE id = ?`,
    state,
    Date.now(),
    recordId,
  );
}

export async function listPendingSyncItems() {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    entity_id: string;
    attempt_count: number;
  }>(
    `SELECT id, entity_id, attempt_count FROM sync_queue
     WHERE next_retry_at_ms IS NULL OR next_retry_at_ms <= ?
     ORDER BY created_at_ms`,
    Date.now(),
  );
}

export async function completeSyncQueueItem(queueId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, queueId);
}

export async function failSyncQueueItem(
  queueId: string,
  errorMessage: string,
  attemptCount: number,
): Promise<void> {
  const db = await getDatabase();
  const delayMs = Math.min(60 * 60 * 1000, 2 ** attemptCount * 5000);
  await db.runAsync(
    `UPDATE sync_queue SET attempt_count = ?, last_error = ?,
      next_retry_at_ms = ? WHERE id = ?`,
    attemptCount,
    errorMessage.slice(0, 500),
    Date.now() + delayMs,
    queueId,
  );
}
