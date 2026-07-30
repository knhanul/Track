import type { SyncStatus } from './models';

const KOREAN_LOCAL_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

const KOREAN_LOCAL_TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
});

export function formatKoreanLocalDate(date: Date): string {
  return KOREAN_LOCAL_DATE_FORMATTER.format(date);
}

export function formatLocalTime(timestampMs: number): string {
  return KOREAN_LOCAL_TIME_FORMATTER.format(new Date(timestampMs));
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatDistance(distanceM: number): string {
  return (Math.max(0, distanceM) / 1000).toFixed(2);
}

export function formatSpeed(speedKph: number): string {
  return Math.max(0, speedKph).toFixed(1);
}

export function formatElevation(elevationM: number): string {
  return Math.round(Math.max(0, elevationM)).toLocaleString('ko-KR');
}

export function formatSyncStatus(syncStatus: SyncStatus): string {
  switch (syncStatus) {
    case 'local_only':
      return '기기 저장';
    case 'pending':
      return '업로드 대기';
    case 'syncing':
      return '동기화 중';
    case 'synced':
      return '클라우드 저장';
    case 'failed':
      return '업로드 실패';
    default:
      return '기기 저장';
  }
}
