import * as Crypto from 'expo-crypto';
import type { LocationObject } from 'expo-location';

import { calculateSpeedKph, haversineDistanceM, sanitizeNumber } from '../domain/geo';
import { formatActivityType, isSelectableActivityType } from '../domain/activityType';
import type {
  ActivityRecordSummary,
  LiveMetrics,
  RecordStatus,
  SyncStatus,
  TodayActivitySummary,
} from '../domain/models';
import type { RecordingGpsState } from '../location/gpsQuality';
import type {
  TrackPoint,
} from '../location/gpsPointValidation';
import { validateGpsPointForMetrics } from '../location/gpsPointValidation';
import type { TrackPointRow } from './trackPointRepository';
import { getDatabase } from './database';

const ACTIVE_RECORD_KEY = 'active_record_id';
const LAST_ACTIVITY_TYPE_KEY = 'last_activity_type';
const MOVING_THRESHOLD_KPH = 1;

interface RecordRow {
  id: string;
  server_id: string | null;
  title: string;
  note: string | null;
  activity_type: string;
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
  server_updated_at_ms: number | null;
  deleted_at_ms: number | null;
  recording_gps_state: string;
}

export type LifeRecordSummary = ActivityRecordSummary;
export type TodaySummary = TodayActivitySummary;

interface LastPointRow {
  sequence_no: number;
  recorded_at_ms: number;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
}

interface TodayAggregateRow {
  record_count: number;
  total_distance_m: number;
  total_elapsed_ms: number;
  total_moving_ms: number;
  total_rest_ms: number;
  total_elevation_gain_m: number;
  pending_sync_count: number;
}

function normalizeActivityType(value: string | null | undefined) {
  if (
    value === 'cycling' ||
    value === 'walking' ||
    value === 'running' ||
    value === 'hiking' ||
    value === 'trail_running' ||
    value === 'unknown'
  ) {
    return value;
  }

  return 'unknown';
}

function normalizeSelectableActivityType(value: string | null | undefined) {
  const normalized = normalizeActivityType(value);
  return isSelectableActivityType(normalized) ? normalized : null;
}

function getLocalDayRange(now: Date): { startMs: number; endMs: number } {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function normalizeRecordingGpsState(value: string | null | undefined): RecordingGpsState {
  if (
    value === 'waiting_for_usable_fix' ||
    value === 'recording_normally' ||
    value === 'temporarily_degraded'
  ) {
    return value;
  }
  return 'recording_normally';
}

function rowToMetrics(row: RecordRow, nowMs = Date.now()): LiveMetrics {
  const elapsedMs =
    row.status === 'completed'
      ? row.elapsed_ms
      : Math.max(row.elapsed_ms, nowMs - row.started_at_ms);
  const restMs = Math.max(row.rest_ms, elapsedMs - row.moving_ms);

  return {
    recordId: row.id,
    activityType: normalizeActivityType(row.activity_type),
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
    recordingGpsState: normalizeRecordingGpsState(row.recording_gps_state),
  };
}

export async function createLifeRecord(
  activityType: Exclude<LiveMetrics['activityType'], 'unknown'>,
  initialGpsState: RecordingGpsState = 'recording_normally',
): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  const dateTitle = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(now));
  const activityLabel = formatActivityType(activityType);

  await db.runAsync(
    `INSERT INTO life_records (
      id, title, activity_type, status, started_at_ms, created_at_ms, updated_at_ms,
      recording_gps_state
    ) VALUES (?, ?, ?, 'recording', ?, ?, ?, ?)`,
    id,
    `${dateTitle} ${activityLabel} 기록`,
    activityType,
    now,
    now,
    now,
    initialGpsState,
  );

  await setLastActivityType(activityType);
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

export async function setLastActivityType(
  activityType: Exclude<LiveMetrics['activityType'], 'unknown'> | null,
): Promise<void> {
  const db = await getDatabase();

  if (!activityType) {
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, LAST_ACTIVITY_TYPE_KEY);
    return;
  }

  await db.runAsync(
    `INSERT INTO app_settings(key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    LAST_ACTIVITY_TYPE_KEY,
    activityType,
  );
}

export async function getLastActivityType(): Promise<
  Exclude<LiveMetrics['activityType'], 'unknown'> | null
> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    LAST_ACTIVITY_TYPE_KEY,
  );

  return normalizeSelectableActivityType(row?.value ?? null);
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
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await db.getFirstAsync<RecordRow>(
        `SELECT * FROM life_records WHERE id = ?`,
        recordId,
      );
      return row ? rowToMetrics(row) : null;
    } catch (error) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      throw error;
    }
  }
  return null;
}

export async function appendLocationBatch(
  recordId: string,
  locations: LocationObject[],
): Promise<void> {
  if (locations.length === 0) return;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await appendLocationBatchInternal(recordId, locations);
      return;
    } catch (error) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      throw error;
    }
  }
}

async function appendLocationBatchInternal(
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

  const activityType = normalizeActivityType(record.activity_type);

  let lastAcceptedPoint = await db.getFirstAsync<LastPointRow>(
    `SELECT sequence_no, recorded_at_ms, latitude, longitude, altitude_m
     FROM track_points
     WHERE record_id = ?
     ORDER BY sequence_no DESC
     LIMIT 1`,
    recordId,
  );

  let lastAllPoint: LastPointRow | null = lastAcceptedPoint;

  let distanceM = record.distance_m;
  let movingMs = record.moving_ms;
  let maxSpeedKph = record.max_speed_kph;
  let currentSpeedKph = record.current_speed_kph;
  let elevationGainM = record.elevation_gain_m;
  let pointCount = record.point_count;
  let nextSequence = (lastAllPoint?.sequence_no ?? -1) + 1;
  let recordingGpsState = normalizeRecordingGpsState(record.recording_gps_state);

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const location of [...locations].sort((a, b) => a.timestamp - b.timestamp)) {
      const accuracyM = sanitizeNumber(location.coords.accuracy);
      const altitudeM = sanitizeNumber(location.coords.altitude);
      const nativeSpeedMps = sanitizeNumber(location.coords.speed);

      const candidate: TrackPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracyM,
        altitudeM,
      };

      const previousForValidation: TrackPoint | null = lastAcceptedPoint
        ? {
            latitude: lastAcceptedPoint.latitude,
            longitude: lastAcceptedPoint.longitude,
            timestamp: lastAcceptedPoint.recorded_at_ms,
            accuracyM: null,
            altitudeM: lastAcceptedPoint.altitude_m,
          }
        : null;

      const validation = validateGpsPointForMetrics(
        previousForValidation,
        candidate,
        activityType,
      );

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
        lastAllPoint = {
          sequence_no: nextSequence,
          recorded_at_ms: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude_m: altitudeM,
        };
        nextSequence += 1;
      }

      if (!validation.usableForMetrics) {
        if (__DEV__) {
          console.debug(
            `[GPS] point rejected: ${validation.reason}, accuracy=${accuracyM ?? 'null'}`,
          );
        }

        if (recordingGpsState === 'recording_normally') {
          recordingGpsState = 'temporarily_degraded';
          if (__DEV__) {
            console.debug('[GPS] degraded signal, metric calculation paused');
          }
        }
        continue;
      }

      if (recordingGpsState === 'waiting_for_usable_fix') {
        lastAcceptedPoint = {
          sequence_no: nextSequence - 1,
          recorded_at_ms: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude_m: altitudeM,
        };
        recordingGpsState = 'recording_normally';
        currentSpeedKph = 0;
        if (__DEV__) {
          console.debug(
            `[GPS] usable fix acquired, accuracy=${accuracyM ?? 'null'}`,
          );
        }
        continue;
      }

      if (recordingGpsState === 'temporarily_degraded') {
        lastAcceptedPoint = {
          sequence_no: nextSequence - 1,
          recorded_at_ms: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude_m: altitudeM,
        };
        recordingGpsState = 'recording_normally';
        currentSpeedKph = 0;
        if (__DEV__) {
          console.debug('[GPS] signal recovered, new baseline point established');
        }
        continue;
      }

      if (lastAcceptedPoint) {
        const deltaMs = location.timestamp - lastAcceptedPoint.recorded_at_ms;
        const segmentDistanceM = haversineDistanceM(
          { latitude: lastAcceptedPoint.latitude, longitude: lastAcceptedPoint.longitude },
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
        );
        const calculatedSpeedKph = calculateSpeedKph(segmentDistanceM, deltaMs);

        currentSpeedKph =
          nativeSpeedMps !== null && nativeSpeedMps >= 0
            ? nativeSpeedMps * 3.6
            : calculatedSpeedKph;

        if (deltaMs > 0) {
          distanceM += segmentDistanceM;
          if (currentSpeedKph >= MOVING_THRESHOLD_KPH) movingMs += deltaMs;
        }

        if (
          lastAcceptedPoint.altitude_m !== null &&
          lastAcceptedPoint.altitude_m !== undefined &&
          altitudeM !== null
        ) {
          const altitudeDelta = altitudeM - lastAcceptedPoint.altitude_m;
          if (altitudeDelta >= 1) elevationGainM += altitudeDelta;
        }

        maxSpeedKph = Math.max(maxSpeedKph, currentSpeedKph);
      }

      lastAcceptedPoint = {
        sequence_no: nextSequence - 1,
        recorded_at_ms: location.timestamp,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude_m: altitudeM,
      };
    }

    const elapsedMs = Math.max(0, Date.now() - record.started_at_ms);
    const restMs = Math.max(0, elapsedMs - movingMs);
    const averageSpeedKph =
      movingMs > 0 ? (distanceM / (movingMs / 1000)) * 3.6 : 0;

    if (recordingGpsState !== 'recording_normally') {
      currentSpeedKph = 0;
    }

    await transaction.runAsync(
      `UPDATE life_records SET
        elapsed_ms = ?, moving_ms = ?, rest_ms = ?, distance_m = ?,
        current_speed_kph = ?, average_speed_kph = ?, max_speed_kph = ?,
        elevation_gain_m = ?, point_count = ?, recording_gps_state = ?,
        updated_at_ms = ?
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
      recordingGpsState,
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
        current_speed_kph = 0, sync_status = 'pending_create', updated_at_ms = ?
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
       ) VALUES (?, 'activity', ?, 'activity_upsert', ?)`,
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

export async function listLifeRecords(limit = 50): Promise<ActivityRecordSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RecordRow>(
    `SELECT * FROM life_records WHERE deleted_at_ms IS NULL ORDER BY started_at_ms DESC LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    ...rowToMetrics(row, row.ended_at_ms ?? Date.now()),
    title: row.title,
    endedAtMs: row.ended_at_ms,
  }));
}

export const listActivityRecords = listLifeRecords;

export async function getTodaySummary(
  now: Date = new Date(),
): Promise<TodayActivitySummary> {
  const db = await getDatabase();
  const { startMs, endMs } = getLocalDayRange(now);

  const aggregate = await db.getFirstAsync<TodayAggregateRow>(
    `SELECT
      COUNT(*) AS record_count,
      COALESCE(SUM(distance_m), 0) AS total_distance_m,
      COALESCE(SUM(elapsed_ms), 0) AS total_elapsed_ms,
      COALESCE(SUM(moving_ms), 0) AS total_moving_ms,
      COALESCE(SUM(rest_ms), 0) AS total_rest_ms,
      COALESCE(SUM(elevation_gain_m), 0) AS total_elevation_gain_m,
      COALESCE(SUM(CASE
        WHEN sync_status IN ('pending', 'pending_create', 'pending_update', 'pending_delete', 'syncing', 'failed', 'sync_error') THEN 1
        ELSE 0
      END), 0) AS pending_sync_count
     FROM life_records
     WHERE started_at_ms >= ?
       AND started_at_ms < ?
       AND status = 'completed'
       AND deleted_at_ms IS NULL`,
    startMs,
    endMs,
  );

  const recentRows = await db.getAllAsync<RecordRow>(
    `SELECT *
     FROM life_records
     WHERE started_at_ms >= ?
       AND started_at_ms < ?
       AND status = 'completed'
       AND deleted_at_ms IS NULL
     ORDER BY started_at_ms DESC
     LIMIT 5`,
    startMs,
    endMs,
  );

  return {
    dateKey: [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-'),
    recordCount: aggregate?.record_count ?? 0,
    totalDistanceM: aggregate?.total_distance_m ?? 0,
    totalElapsedMs: aggregate?.total_elapsed_ms ?? 0,
    totalMovingMs: aggregate?.total_moving_ms ?? 0,
    totalRestMs: aggregate?.total_rest_ms ?? 0,
    totalElevationGainM: aggregate?.total_elevation_gain_m ?? 0,
    pendingSyncCount: aggregate?.pending_sync_count ?? 0,
    recentRecords: recentRows.map((row) => ({
      ...rowToMetrics(row, row.ended_at_ms ?? Date.now()),
      title: row.title,
      endedAtMs: row.ended_at_ms,
    })),
  };
}

export async function getRecordUploadPayload(recordId: string) {
  const db = await getDatabase();
  const record = await db.getFirstAsync<RecordRow>(
    `SELECT * FROM life_records WHERE id = ?`,
    recordId,
  );
  const points = await db.getAllAsync<TrackPointRow>(
    `SELECT id, sequence_no, recorded_at_ms, latitude, longitude,
      altitude_m, accuracy_m, speed_mps, heading
     FROM track_points WHERE record_id = ? ORDER BY sequence_no`,
    recordId,
  );
  return record
    ? {
        record: {
          id: record.id,
          serverId: record.server_id,
          title: record.title,
          note: record.note,
          activityType: normalizeActivityType(record.activity_type),
          status: record.status,
          startedAtMs: record.started_at_ms,
          endedAtMs: record.ended_at_ms,
          elapsedMs: record.elapsed_ms,
          movingMs: record.moving_ms,
          restMs: record.rest_ms,
          distanceM: record.distance_m,
          averageSpeedKph: record.average_speed_kph,
          maxSpeedKph: record.max_speed_kph,
          elevationGainM: record.elevation_gain_m,
          pointCount: record.point_count,
          syncStatus: record.sync_status,
          serverUpdatedAtMs: record.server_updated_at_ms,
          deletedAtMs: record.deleted_at_ms,
        },
        points,
      }
    : null;
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
    entity_type: string;
    entity_id: string;
    operation: string;
    attempt_count: number;
  }>(
    `SELECT id, entity_type, entity_id, operation, attempt_count FROM sync_queue
     WHERE next_retry_at_ms IS NULL OR next_retry_at_ms <= ?
     ORDER BY created_at_ms`,
    Date.now(),
  );
}

export async function getPendingSyncRecordCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM life_records
     WHERE status = 'completed' AND deleted_at_ms IS NULL
       AND sync_status IN ('pending', 'pending_create', 'pending_update', 'pending_delete', 'syncing', 'failed', 'sync_error')`,
  );
  return row?.count ?? 0;
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

export async function getLifeRecordByLocalId(recordId: string): Promise<RecordRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<RecordRow>(`SELECT * FROM life_records WHERE id = ?`, recordId);
}

export async function getLifeRecordByServerId(serverId: string): Promise<RecordRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<RecordRow>(`SELECT * FROM life_records WHERE server_id = ?`, serverId);
}

export interface RemoteActivitySnapshot {
  id: string;
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
  updatedAt: string;
  deletedAt: string | null;
}

export interface RemoteTrackPointSnapshot {
  seqNo: number;
  recordedAt: string;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  accuracyM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
}

export async function upsertRemoteActivitySnapshot(
  snapshot: RemoteActivitySnapshot,
  points: RemoteTrackPointSnapshot[] = [],
): Promise<string> {
  const db = await getDatabase();
  const localId = snapshot.clientId || snapshot.id;
  const startedAtMs = Date.parse(snapshot.startedAt);
  const endedAtMs = snapshot.endedAt ? Date.parse(snapshot.endedAt) : null;
  const serverUpdatedAtMs = Date.parse(snapshot.updatedAt);
  const deletedAtMs = snapshot.deletedAt ? Date.parse(snapshot.deletedAt) : null;
  const existingByLocal = await db.getFirstAsync<RecordRow>(`SELECT * FROM life_records WHERE id = ?`, localId);
  const existingByServer = existingByLocal ? null : await db.getFirstAsync<RecordRow>(`SELECT * FROM life_records WHERE server_id = ?`, snapshot.id);

  const targetId = existingByLocal?.id ?? existingByServer?.id ?? localId;
  const targetServerId = snapshot.id;
  const syncStatus: SyncStatus = deletedAtMs ? 'synced' : 'synced';
  const status = snapshot.endedAt || deletedAtMs ? 'completed' : 'recording';
  const now = Date.now();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    if (existingByLocal || existingByServer) {
      await transaction.runAsync(
        `UPDATE life_records SET
          server_id = ?, title = ?, note = ?, activity_type = ?, status = ?,
          started_at_ms = ?, ended_at_ms = ?, elapsed_ms = ?, moving_ms = ?, rest_ms = ?,
          distance_m = ?, average_speed_kph = ?, max_speed_kph = ?, elevation_gain_m = ?,
          sync_status = ?, server_updated_at_ms = ?, deleted_at_ms = ?, updated_at_ms = ?
         WHERE id = ?`,
        targetServerId,
        snapshot.title,
        snapshot.note,
        normalizeActivityType(snapshot.activityType),
        status,
        startedAtMs,
        endedAtMs,
        snapshot.elapsedTimeSec * 1000,
        snapshot.movingTimeSec * 1000,
        Math.max(0, snapshot.elapsedTimeSec * 1000 - snapshot.movingTimeSec * 1000),
        snapshot.distanceM,
        snapshot.averageSpeedMps * 3.6,
        snapshot.maxSpeedMps * 3.6,
        snapshot.elevationGainM,
        syncStatus,
        Number.isFinite(serverUpdatedAtMs) ? serverUpdatedAtMs : now,
        deletedAtMs,
        now,
        targetId,
      );
    } else {
      await transaction.runAsync(
        `INSERT INTO life_records (
          id, server_id, title, note, activity_type, status, started_at_ms, ended_at_ms,
          elapsed_ms, moving_ms, rest_ms, distance_m, current_speed_kph, average_speed_kph,
          max_speed_kph, elevation_gain_m, point_count, sync_status, server_updated_at_ms,
          deleted_at_ms, created_at_ms, updated_at_ms, recording_gps_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recording_normally')`,
        targetId,
        targetServerId,
        snapshot.title,
        snapshot.note,
        normalizeActivityType(snapshot.activityType),
        status,
        startedAtMs,
        endedAtMs,
        snapshot.elapsedTimeSec * 1000,
        snapshot.movingTimeSec * 1000,
        Math.max(0, snapshot.elapsedTimeSec * 1000 - snapshot.movingTimeSec * 1000),
        snapshot.distanceM,
        snapshot.averageSpeedMps * 3.6,
        snapshot.maxSpeedMps * 3.6,
        snapshot.elevationGainM,
        points.length,
        syncStatus,
        Number.isFinite(serverUpdatedAtMs) ? serverUpdatedAtMs : now,
        deletedAtMs,
        now,
        now,
      );
    }

    if (points.length > 0) {
      for (const point of points) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO track_points (
            id, record_id, sequence_no, recorded_at_ms, latitude, longitude,
            altitude_m, accuracy_m, speed_mps, heading
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          Crypto.randomUUID(),
          targetId,
          point.seqNo,
          Date.parse(point.recordedAt),
          point.latitude,
          point.longitude,
          point.altitudeM,
          point.accuracyM,
          point.speedMps,
          point.headingDeg,
        );
      }
      await transaction.runAsync(
        `UPDATE life_records SET point_count = (SELECT COUNT(*) FROM track_points WHERE record_id = ?) WHERE id = ?`,
        targetId,
        targetId,
      );
    }
  });

  return targetId;
}

export async function markRecordServerSynced(
  recordId: string,
  serverId: string,
  serverUpdatedAtMs: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE life_records SET server_id = ?, server_updated_at_ms = ?, sync_status = 'synced', updated_at_ms = ? WHERE id = ?`,
    serverId,
    serverUpdatedAtMs,
    Date.now(),
    recordId,
  );
}

export async function markRecordSoftDeleted(recordId: string, syncStatus: SyncStatus = 'pending_delete'): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE life_records SET deleted_at_ms = ?, sync_status = ?, updated_at_ms = ? WHERE id = ?`,
    Date.now(),
    syncStatus,
    Date.now(),
    recordId,
  );
}
