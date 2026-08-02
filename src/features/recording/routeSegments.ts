import type { TrackPointRow } from '../../database/trackPointRepository';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  id: string;
  coordinates: LatLng[];
}

const MAX_ACCURACY_M = 100;
const SEGMENT_GAP_MS = 10_000;
const MAX_DISPLAY_POINTS = 2000;

function isPointValid(point: TrackPointRow): boolean {
  if (point.accuracy_m === null) return false;
  if (point.accuracy_m > MAX_ACCURACY_M) return false;
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return false;
  return true;
}

export function buildRouteSegments(points: TrackPointRow[]): RouteSegment[] {
  const valid = points.filter(isPointValid);
  if (valid.length === 0) return [];

  const first = valid[0]!;
  const segments: RouteSegment[] = [];
  let currentCoords: LatLng[] = [{ latitude: first.latitude, longitude: first.longitude }];
  let lastTime = first.recorded_at_ms;
  let segmentIndex = 0;

  for (let i = 1; i < valid.length; i++) {
    const point = valid[i]!;
    const gap = point.recorded_at_ms - lastTime;

    if (gap > SEGMENT_GAP_MS) {
      if (currentCoords.length >= 2) {
        segments.push({ id: `seg-${segmentIndex}`, coordinates: currentCoords });
        segmentIndex++;
      }
      currentCoords = [{ latitude: point.latitude, longitude: point.longitude }];
    } else {
      currentCoords.push({ latitude: point.latitude, longitude: point.longitude });
    }
    lastTime = point.recorded_at_ms;
  }

  if (currentCoords.length >= 1) {
    segments.push({ id: `seg-${segmentIndex}`, coordinates: currentCoords });
  }

  return segments;
}

export function appendPointsToSegments(
  segments: RouteSegment[],
  newPoints: TrackPointRow[],
  lastValidTime: number | null,
): { segments: RouteSegment[]; lastValidTime: number | null } {
  const valid = newPoints.filter(isPointValid);
  if (valid.length === 0) return { segments, lastValidTime };

  const result = segments.length > 0
    ? segments.map((s) => ({ ...s, coordinates: [...s.coordinates] }))
    : [];
  let segmentIndex = result.length;
  let currentTime = lastValidTime;

  if (result.length === 0) {
    const first = valid[0]!;
    result.push({ id: `seg-${segmentIndex}`, coordinates: [{ latitude: first.latitude, longitude: first.longitude }] });
    currentTime = first.recorded_at_ms;
    segmentIndex++;
  }

  let currentSegment = result[result.length - 1]!;

  for (let i = currentTime === lastValidTime ? 1 : 0; i < valid.length; i++) {
    const point = valid[i]!;
    const gap = currentTime !== null ? point.recorded_at_ms - currentTime : 0;

    if (gap > SEGMENT_GAP_MS) {
      const newSeg: RouteSegment = { id: `seg-${segmentIndex}`, coordinates: [{ latitude: point.latitude, longitude: point.longitude }] };
      result.push(newSeg);
      segmentIndex++;
      currentSegment = newSeg;
    } else {
      currentSegment.coordinates.push({ latitude: point.latitude, longitude: point.longitude });
    }
    currentTime = point.recorded_at_ms;
  }

  return { segments: result, lastValidTime: currentTime };
}

export function downsampleSegments(segments: RouteSegment[]): RouteSegment[] {
  const totalPoints = segments.reduce((sum, s) => sum + s.coordinates.length, 0);
  if (totalPoints <= MAX_DISPLAY_POINTS) return segments;

  const step = Math.ceil(totalPoints / MAX_DISPLAY_POINTS);
  return segments.map((segment) => {
    if (segment.coordinates.length <= 2) return segment;
    const sampled: LatLng[] = [];
    for (let i = 0; i < segment.coordinates.length; i += step) {
      sampled.push(segment.coordinates[i]!);
    }
    const last = segment.coordinates[segment.coordinates.length - 1]!;
    if (sampled[sampled.length - 1] !== last) {
      sampled.push(last);
    }
    return { ...segment, coordinates: sampled };
  });
}

export function getAllCoordinates(segments: RouteSegment[]): LatLng[] {
  return segments.flatMap((s) => s.coordinates);
}

export function getLastPoint(segments: RouteSegment[]): LatLng | null {
  if (segments.length === 0) return null;
  const lastSegment = segments[segments.length - 1]!;
  if (lastSegment.coordinates.length === 0) return null;
  return lastSegment.coordinates[lastSegment.coordinates.length - 1]!;
}

export function getFirstPoint(segments: RouteSegment[]): LatLng | null {
  if (segments.length === 0) return null;
  const firstSegment = segments[0]!;
  if (firstSegment.coordinates.length === 0) return null;
  return firstSegment.coordinates[0]!;
}
