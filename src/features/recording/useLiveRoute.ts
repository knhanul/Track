import { useCallback, useEffect, useRef, useState } from 'react';

import { getTrackPoints } from '../../database/trackPointRepository';
import {
  type LatLng,
  type RouteSegment,
  appendPointsToSegments,
  buildRouteSegments,
  downsampleSegments,
  getFirstPoint,
  getLastPoint,
} from './routeSegments';

const POLL_INTERVAL_MS = 3000;

interface LiveRouteState {
  segments: RouteSegment[];
  startPoint: LatLng | null;
  currentPoint: LatLng | null;
  totalPointCount: number;
}

export function useLiveRoute(activeRecordId: string | null): LiveRouteState {
  const [rawSegments, setRawSegments] = useState<RouteSegment[]>([]);
  const [totalPointCount, setTotalPointCount] = useState(0);
  const lastSequenceNo = useRef(-1);
  const lastValidTime = useRef<number | null>(null);

  const loadInitial = useCallback(async (recordId: string) => {
    let points: Awaited<ReturnType<typeof getTrackPoints>>;
    try {
      points = await getTrackPoints(recordId);
    } catch {
      return;
    }
    if (points.length === 0) return;

    const segments = buildRouteSegments(points);
    lastSequenceNo.current = points[points.length - 1]?.sequence_no ?? -1;

    const allCoords = segments.flatMap((s) => s.coordinates);
    if (allCoords.length > 0) {
      const last = allCoords[allCoords.length - 1]!;
      lastValidTime.current = points.find((p) => p.latitude === last.latitude && p.longitude === last.longitude)?.recorded_at_ms ?? null;
    }

    setRawSegments(segments);
    setTotalPointCount(points.length);
  }, []);

  const pollNewPoints = useCallback(async (recordId: string) => {
    let newPoints: Awaited<ReturnType<typeof getTrackPoints>>;
    try {
      newPoints = await getTrackPoints(recordId, lastSequenceNo.current);
    } catch {
      return;
    }
    if (newPoints.length === 0) return;

    lastSequenceNo.current = newPoints[newPoints.length - 1]?.sequence_no ?? lastSequenceNo.current;

    setRawSegments((prev) => {
      const { segments: updated, lastValidTime: newTime } = appendPointsToSegments(
        prev,
        newPoints,
        lastValidTime.current,
      );
      lastValidTime.current = newTime;
      return updated;
    });
    setTotalPointCount((prev) => prev + newPoints.length);
  }, []);

  useEffect(() => {
    if (!activeRecordId) {
      setRawSegments([]);
      setTotalPointCount(0);
      lastSequenceNo.current = -1;
      lastValidTime.current = null;
      return;
    }

    void loadInitial(activeRecordId);
    const timer = setInterval(() => void pollNewPoints(activeRecordId), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeRecordId, loadInitial, pollNewPoints]);

  const segments = downsampleSegments(rawSegments);

  return {
    segments,
    startPoint: getFirstPoint(segments),
    currentPoint: getLastPoint(segments),
    totalPointCount,
  };
}
