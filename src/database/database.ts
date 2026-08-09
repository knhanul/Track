import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync('nuni-life.db');
  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS life_records (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      title TEXT NOT NULL,
      note TEXT,
      activity_type TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL,
      started_at_ms INTEGER NOT NULL,
      ended_at_ms INTEGER,
      elapsed_ms INTEGER NOT NULL DEFAULT 0,
      moving_ms INTEGER NOT NULL DEFAULT 0,
      rest_ms INTEGER NOT NULL DEFAULT 0,
      distance_m REAL NOT NULL DEFAULT 0,
      current_speed_kph REAL NOT NULL DEFAULT 0,
      average_speed_kph REAL NOT NULL DEFAULT 0,
      max_speed_kph REAL NOT NULL DEFAULT 0,
      elevation_gain_m REAL NOT NULL DEFAULT 0,
      point_count INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'local_only',
      server_updated_at_ms INTEGER,
      deleted_at_ms INTEGER,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS track_points (
      id TEXT PRIMARY KEY NOT NULL,
      record_id TEXT NOT NULL,
      sequence_no INTEGER NOT NULL,
      recorded_at_ms INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude_m REAL,
      accuracy_m REAL,
      speed_mps REAL,
      heading REAL,
      FOREIGN KEY(record_id) REFERENCES life_records(id) ON DELETE CASCADE,
      UNIQUE(record_id, recorded_at_ms, latitude, longitude)
    );

    CREATE INDEX IF NOT EXISTS idx_track_points_record_sequence
      ON track_points(record_id, sequence_no);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_retry_at_ms INTEGER,
      created_at_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  const lifeRecordsColumns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(life_records)`
  );
  const hasActivityType = lifeRecordsColumns.some((column) => column.name === 'activity_type');

  if (!hasActivityType) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'unknown';`);
  }

  const hasRecordingGpsState = lifeRecordsColumns.some((column) => column.name === 'recording_gps_state');

  if (!hasRecordingGpsState) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN recording_gps_state TEXT NOT NULL DEFAULT 'recording_normally';`);
  }

  const hasServerId = lifeRecordsColumns.some((column) => column.name === 'server_id');
  if (!hasServerId) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN server_id TEXT;`);
  }

  const hasNote = lifeRecordsColumns.some((column) => column.name === 'note');
  if (!hasNote) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN note TEXT;`);
  }

  const hasServerUpdatedAt = lifeRecordsColumns.some((column) => column.name === 'server_updated_at_ms');
  if (!hasServerUpdatedAt) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN server_updated_at_ms INTEGER;`);
  }

  const hasDeletedAt = lifeRecordsColumns.some((column) => column.name === 'deleted_at_ms');
  if (!hasDeletedAt) {
    await db.execAsync(`ALTER TABLE life_records ADD COLUMN deleted_at_ms INTEGER;`);
  }
}
