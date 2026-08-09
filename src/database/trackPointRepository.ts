import { getDatabase } from './database';

export interface TrackPointRow {
  sequence_no: number;
  recorded_at_ms: number;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading: number | null;
}

export async function getTrackPoints(
  recordId: string,
  afterSequenceNo = -1,
): Promise<TrackPointRow[]> {
  const db = await getDatabase();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.getAllAsync<TrackPointRow>(
        `SELECT sequence_no, recorded_at_ms, latitude, longitude, altitude_m, accuracy_m, speed_mps, heading
         FROM track_points
         WHERE record_id = ? AND sequence_no > ?
         ORDER BY sequence_no ASC`,
        recordId,
        afterSequenceNo,
      );
    } catch (error) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      throw error;
    }
  }
  return [];
}

export async function getTrackPointCount(recordId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM track_points WHERE record_id = ?`,
    recordId,
  );
  return row?.count ?? 0;
}
