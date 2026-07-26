const EARTH_RADIUS_M = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export function haversineDistanceM(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(value));
}

export function calculateSpeedKph(distanceM: number, elapsedMs: number): number {
  if (distanceM <= 0 || elapsedMs <= 0) return 0;
  return (distanceM / (elapsedMs / 1000)) * 3.6;
}

export function sanitizeNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
