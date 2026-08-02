import type { TodayActivitySummary } from './models';
import { formatDistance } from './format';

interface TodaySummaryText {
  primary: string;
  secondary: string;
}

const ONE_MINUTE_MS = 60 * 1000;

export function buildTodaySummaryText(summary: TodayActivitySummary): TodaySummaryText {
  if (summary.recordCount === 0) {
    return {
      primary: '아직 오늘의 활동 기록이 없어요.',
      secondary: '첫 야외활동을 기록해 보세요.',
    };
  }

  const primary = `오늘 ${formatDistance(summary.totalDistanceM)}km를 기록했어요.`;

  if (summary.totalMovingMs < ONE_MINUTE_MS) {
    return {
      primary,
      secondary: '',
    };
  }

  const movingText = formatMovingDurationKorean(summary.totalMovingMs);
  return {
    primary,
    secondary: `${movingText} 동안 활동했어요.`,
  };
}

function formatMovingDurationKorean(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / ONE_MINUTE_MS));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  if (hours > 0) {
    return `${hours}시간`;
  }

  return `${minutes}분`;
}
