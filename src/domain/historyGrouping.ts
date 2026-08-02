import type { LifeRecordSummary } from './models';

export interface HistoryDateGroup {
  dateKey: string;
  label: string;
  records: LifeRecordSummary[];
}

const KOREAN_HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

const KOREAN_HISTORY_DATE_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function groupRecordsByLocalDate(
  records: LifeRecordSummary[],
  now: Date = new Date(),
): HistoryDateGroup[] {
  const sortedRecords = [...records].sort((a, b) => b.startedAtMs - a.startedAtMs);
  const grouped = new Map<string, LifeRecordSummary[]>();

  for (const record of sortedRecords) {
    const date = new Date(record.startedAtMs);
    const dateKey = toLocalDateKey(date);
    const current = grouped.get(dateKey);

    if (current) {
      current.push(record);
      continue;
    }

    grouped.set(dateKey, [record]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (left === right) {
        return 0;
      }

      return left < right ? 1 : -1;
    })
    .map(([dateKey, dateRecords]) => {
      const firstDate = new Date(dateRecords[0]!.startedAtMs);

      return {
        dateKey,
        label: formatHistoryGroupLabel(firstDate, now),
        records: dateRecords.sort((a, b) => b.startedAtMs - a.startedAtMs),
      };
    });
}

export function formatHistoryGroupLabel(date: Date, now: Date = new Date()): string {
  const dateKey = toLocalDateKey(date);
  const todayKey = toLocalDateKey(now);

  if (dateKey === todayKey) {
    return '오늘';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  if (dateKey === yesterdayKey) {
    return '어제';
  }

  if (date.getFullYear() !== now.getFullYear()) {
    return KOREAN_HISTORY_DATE_WITH_YEAR_FORMATTER.format(date);
  }

  return KOREAN_HISTORY_DATE_FORMATTER.format(date);
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
