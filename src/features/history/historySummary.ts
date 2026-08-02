import type { ActivityRecordSummary } from '../../domain/models';
import type { ActivityType } from '../../domain/activityType';

export interface ActivityHistorySummary {
  activityCount: number;
  totalDistanceM: number;
  totalMovingMs: number;
  totalElevationGainM: number;
}

function safeNumber(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function summarizeActivityRecords(
  records: ActivityRecordSummary[],
): ActivityHistorySummary {
  let totalDistanceM = 0;
  let totalMovingMs = 0;
  let totalElevationGainM = 0;

  for (const record of records) {
    totalDistanceM += safeNumber(record.distanceM);
    totalMovingMs += safeNumber(record.movingMs);
    totalElevationGainM += safeNumber(record.elevationGainM);
  }

  return {
    activityCount: records.length,
    totalDistanceM,
    totalMovingMs,
    totalElevationGainM,
  };
}

export type ActivityHistoryTypeFilter = 'all' | ActivityType;

export function filterRecordsByActivityType(
  records: ActivityRecordSummary[],
  filter: ActivityHistoryTypeFilter,
): ActivityRecordSummary[] {
  if (filter === 'all') return records;
  return records.filter((record) => record.activityType === filter);
}

export function hasUnknownRecords(records: ActivityRecordSummary[]): boolean {
  return records.some((record) => record.activityType === 'unknown');
}
