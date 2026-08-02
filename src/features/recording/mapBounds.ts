import type { LatLng, RouteSegment } from './routeSegments';

export interface RouteBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function calculateRouteBounds(
  segments: RouteSegment[],
): RouteBounds | null {
  const allCoords = segments.flatMap((s) => s.coordinates);
  if (allCoords.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const coord of allCoords) {
    if (coord.longitude < west) west = coord.longitude;
    if (coord.latitude < south) south = coord.latitude;
    if (coord.longitude > east) east = coord.longitude;
    if (coord.latitude > north) north = coord.latitude;
  }

  return { west, south, east, north };
}

export function toLngLat(point: LatLng): [number, number] {
  return [point.longitude, point.latitude];
}

export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRouteSpanMeters(bounds: RouteBounds): number {
  return haversineDistanceMeters(
    { latitude: bounds.south, longitude: bounds.west },
    { latitude: bounds.north, longitude: bounds.east },
  );
}
