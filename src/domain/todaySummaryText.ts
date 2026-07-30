import type { TodaySummary } from '../database/recordRepository';
import { formatDistance } from './format';

interface TodaySummaryText {
  primary: string;
  secondary: string;
}

const ONE_MINUTE_MS = 60 * 1000;

export function buildTodaySummaryText(summary: TodaySummary): TodaySummaryText {
  if (summary.recordCount === 0) {
    return {
      primary: '아직 오늘의 움직임이 없어요.',
      secondary: '첫 기록을 남겨 보세요.',
    };
  }

  const primary = `오늘 ${formatDistance(summary.totalDistanceM)}km를 이동했어요.`;

  if (summary.totalMovingMs < ONE_MINUTE_MS) {
    return {
      primary,
      secondary: '',
    };
  }

  const movingText = formatMovingDurationKorean(summary.totalMovingMs);
  return {
    primary,
    secondary: `${movingText} 동안 움직였어요.`,
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
