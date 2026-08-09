import type { ActivityType, SelectableActivityType } from './activityType';
import type { RecordingGpsState } from '../location/gpsQuality';

export type RecordStatus = 'recording' | 'paused' | 'completed';
export type SyncStatus =
  | 'local_only'
  | 'pending'
  | 'pending_create'
  | 'pending_update'
  | 'pending_delete'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'sync_error';
export type { RecordingGpsState } from '../location/gpsQuality';

export interface LiveMetrics {
  recordId: string;
  activityType: ActivityType;
  status: RecordStatus;
  startedAtMs: number;
  elapsedMs: number;
  movingMs: number;
  restMs: number;
  distanceM: number;
  currentSpeedKph: number;
  averageSpeedKph: number;
  maxSpeedKph: number;
  elevationGainM: number;
  pointCount: number;
  syncStatus: SyncStatus;
  recordingGpsState: RecordingGpsState;
}

export interface ActivityRecordSummary extends LiveMetrics {
  title: string;
  endedAtMs: number | null;
}

export type LifeRecordSummary = ActivityRecordSummary;

export interface TodayActivitySummary {
  dateKey: string;
  recordCount: number;
  totalDistanceM: number;
  totalElapsedMs: number;
  totalMovingMs: number;
  totalRestMs: number;
  totalElevationGainM: number;
  pendingSyncCount: number;
  recentRecords: ActivityRecordSummary[];
}

export type TodaySummary = TodayActivitySummary;

export interface RecorderController {
  activeRecordId: string | null;
  metrics: LiveMetrics | null;
  busy: boolean;
  error: string | null;
  restore(): Promise<void>;
  start(activityType: SelectableActivityType, initialGpsState?: RecordingGpsState): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}
