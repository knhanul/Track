export type RecordStatus = 'recording' | 'paused' | 'completed';
export type SyncStatus = 'local_only' | 'pending' | 'syncing' | 'synced' | 'failed';

export interface LiveMetrics {
  recordId: string;
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
}

export interface LifeRecordSummary extends LiveMetrics {
  title: string;
  endedAtMs: number | null;
}

export interface RecorderController {
  activeRecordId: string | null;
  metrics: LiveMetrics | null;
  busy: boolean;
  error: string | null;
  restore(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}
