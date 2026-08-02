import type { ActivityRecordSummary } from '../../domain/models';

export type ActivityHistoryPeriod = 'week' | 'month' | 'all';

export interface ActivityPeriodRange {
  startMs: number | null;
  endMs: number;
}

export function getActivityPeriodRange(
  period: ActivityHistoryPeriod,
  nowMs: number = Date.now(),
): ActivityPeriodRange {
  const now = new Date(nowMs);

  if (period === 'all') {
    return { startMs: null, endMs: nowMs };
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);
    return { startMs: monday.getTime(), endMs: nowMs };
  }

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { startMs: firstOfMonth.getTime(), endMs: nowMs };
}

export function filterRecordsByPeriod(
  records: ActivityRecordSummary[],
  period: ActivityHistoryPeriod,
  nowMs: number = Date.now(),
): ActivityRecordSummary[] {
  const { startMs, endMs } = getActivityPeriodRange(period, nowMs);

  return records.filter((record) => {
    if (record.startedAtMs > endMs) return false;
    if (startMs !== null && record.startedAtMs < startMs) return false;
    return true;
  });
}
