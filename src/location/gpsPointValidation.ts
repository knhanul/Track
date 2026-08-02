import type { ActivityType } from '../domain/activityType';
import type { Coordinate } from '../domain/geo';
import { haversineDistanceM, sanitizeNumber } from '../domain/geo';

export interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracyM: number | null;
  altitudeM: number | null;
}

export type GpsPointRejectionReason =
  | 'ok'
  | 'invalid_coordinates'
  | 'invalid_timestamp'
  | 'accuracy_too_low'
  | 'impossible_speed'
  | 'duplicate_or_out_of_order';

export interface GpsPointValidationResult {
  usableForMetrics: boolean;
  reason: GpsPointRejectionReason;
}

const MAX_ACCURACY_FOR_METRICS_M = 100;

const ACTIVITY_SPEED_LIMITS_KPH: Record<ActivityType, number> = {
  walking: 15,
  running: 35,
  hiking: 20,
  trail_running: 35,
  cycling: 100,
  unknown: 100,
};

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function validateGpsPointForMetrics(
  previousPoint: TrackPoint | null,
  candidate: TrackPoint,
  activityType: ActivityType,
): GpsPointValidationResult {
  if (!isValidCoordinate(candidate.latitude, candidate.longitude)) {
    return { usableForMetrics: false, reason: 'invalid_coordinates' };
  }

  if (
    !Number.isFinite(candidate.timestamp) ||
    candidate.timestamp <= 0
  ) {
    return { usableForMetrics: false, reason: 'invalid_timestamp' };
  }

  const accuracy = sanitizeNumber(candidate.accuracyM);
  if (accuracy === null || accuracy > MAX_ACCURACY_FOR_METRICS_M) {
    return { usableForMetrics: false, reason: 'accuracy_too_low' };
  }

  if (previousPoint) {
    if (candidate.timestamp <= previousPoint.timestamp) {
      return { usableForMetrics: false, reason: 'duplicate_or_out_of_order' };
    }

    const deltaMs = candidate.timestamp - previousPoint.timestamp;
    if (deltaMs <= 0) {
      return { usableForMetrics: false, reason: 'duplicate_or_out_of_order' };
    }

    const segmentDistanceM = haversineDistanceM(
      { latitude: previousPoint.latitude, longitude: previousPoint.longitude } satisfies Coordinate,
      { latitude: candidate.latitude, longitude: candidate.longitude } satisfies Coordinate,
    );

    const speedKph = (segmentDistanceM / (deltaMs / 1000)) * 3.6;
    const limit = ACTIVITY_SPEED_LIMITS_KPH[activityType] ?? 100;

    if (speedKph > limit) {
      return { usableForMetrics: false, reason: 'impossible_speed' };
    }
  }

  return { usableForMetrics: true, reason: 'ok' };
}

export function isAccuracyAcceptableForMetrics(
  accuracyM: number | null | undefined,
): boolean {
  const accuracy = sanitizeNumber(accuracyM);
  return accuracy !== null && accuracy <= MAX_ACCURACY_FOR_METRICS_M;
}
