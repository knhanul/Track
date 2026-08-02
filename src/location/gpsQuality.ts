export type GpsQualityStatus = 'good' | 'low' | 'very_low';

export type RecordingGpsState =
  | 'waiting_for_usable_fix'
  | 'recording_normally'
  | 'temporarily_degraded';

const GOOD_ACCURACY_THRESHOLD_M = 30;
const LOW_ACCURACY_THRESHOLD_M = 100;

export function getGpsQualityStatus(
  accuracyM: number | null | undefined,
): GpsQualityStatus {
  if (
    typeof accuracyM !== 'number' ||
    !Number.isFinite(accuracyM) ||
    accuracyM <= 0
  ) {
    return 'very_low';
  }

  if (accuracyM <= GOOD_ACCURACY_THRESHOLD_M) {
    return 'good';
  }

  if (accuracyM <= LOW_ACCURACY_THRESHOLD_M) {
    return 'low';
  }

  return 'very_low';
}

export function isAccuracyGood(accuracyM: number | null | undefined): boolean {
  return getGpsQualityStatus(accuracyM) === 'good';
}

export function canStartRecording(accuracyM: number | null | undefined): boolean {
  return getGpsQualityStatus(accuracyM) !== 'very_low' || true;
}

export function getInitialRecordingGpsState(
  accuracyM: number | null | undefined,
): RecordingGpsState {
  const quality = getGpsQualityStatus(accuracyM);
  if (quality === 'good') {
    return 'recording_normally';
  }
  return 'waiting_for_usable_fix';
}

export function getAccuracyDisplayText(accuracyM: number | null): string {
  if (accuracyM == null || !Number.isFinite(accuracyM) || accuracyM <= 0) {
    return '현재 위치 정확도를 확인할 수 없어요.';
  }
  return `현재 위치 정확도 ${Math.round(accuracyM)}m`;
}
