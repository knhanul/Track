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

export function formatPaceFromSpeedKph(speedKph: number): string {
  if (!Number.isFinite(speedKph) || speedKph <= 0) {
    return "--'--\"/km";
  }

  const secondsPerKm = Math.round(3600 / speedKph);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${String(seconds).padStart(2, '0')}"/km`;
}

export function formatElevation(elevationM: number): string {
  return Math.round(Math.max(0, elevationM)).toLocaleString('ko-KR');
}

export function formatSummaryDistance(distanceM: number): string {
  const km = Math.max(0, distanceM) / 1000;
  if (km >= 100) return km.toFixed(0);
  if (km >= 10) return km.toFixed(1);
  return km.toFixed(2);
}

export function formatSummaryDuration(durationMs: number): string {
  const totalMinutes = Math.floor(Math.max(0, durationMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
}

export function formatRestDuration(restMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, restMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${seconds}초`;
  return `${seconds}초`;
}

export function formatCompactDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  if (minutes > 0) return `${minutes}분 ${seconds}초`;
  return `${seconds}초`;
}

export function formatSyncStatus(syncStatus: SyncStatus): string {
  switch (syncStatus) {
    case 'local_only':
      return '기기 저장';
    case 'pending':
    case 'pending_create':
    case 'pending_update':
    case 'pending_delete':
      return '업로드 대기';
    case 'syncing':
      return '동기화 중';
    case 'synced':
      return '클라우드 저장';
    case 'failed':
    case 'sync_error':
      return '업로드 실패';
    default:
      return '기기 저장';
  }
}
