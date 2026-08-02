import type { Feature, FeatureCollection, LineString } from 'geojson';

import type { RouteSegment } from './routeSegments';

export function routeSegmentToFeature(
  segment: RouteSegment,
): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {
      segmentId: segment.id,
    },
    geometry: {
      type: 'LineString',
      coordinates: segment.coordinates.map((point) => [
        point.longitude,
        point.latitude,
      ]),
    },
  };
}

export function routeSegmentsToFeatureCollection(
  segments: RouteSegment[],
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: segments
      .filter((segment) => segment.coordinates.length >= 2)
      .map(routeSegmentToFeature),
  };
}
