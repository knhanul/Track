import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { Locate, Minus, Plus, Scan } from 'lucide-react-native';

import { MAP_STYLE_URL } from '../../../config/mapConfig';
import { formatActivityType, type ActivityType } from '../../../domain/activityType';
import type { RecordingGpsState } from '../../../domain/models';
import type { LatLng, RouteSegment } from '../routeSegments';
import { getAllCoordinates } from '../routeSegments';
import { routeSegmentsToFeatureCollection } from '../liveRouteGeoJson';
import { calculateRouteBounds, calculateRouteSpanMeters, toLngLat } from '../mapBounds';
import {
  AUTO_FIT_MIN_INTERVAL_MS,
  AUTO_FIT_TRANSITION_DISTANCE_M,
  FIT_PADDING,
  FOLLOW_THROTTLE_MS,
  FOLLOW_ZOOM_BY_ACTIVITY,
  MANUAL_MIN_ZOOM,
  MAX_ZOOM,
  type LiveMapCameraMode,
} from '../mapCamera';
import { colors, radius, spacing, typography } from '../../../theme';

interface LiveRouteMapProps {
  activityType: ActivityType;
  recordingStatus: 'recording' | 'paused';
  gpsState: RecordingGpsState;
  segments: RouteSegment[];
  startPoint: LatLng | null;
  currentPoint: LatLng | null;
}

const ROUTE_SOURCE_ID = 'route-source';
const ROUTE_LAYER_ID = 'route-layer';
const PROGRAMMATIC_MOVE_GUARD_MS = 600;

export function LiveRouteMap({
  activityType,
  recordingStatus,
  gpsState,
  segments,
  startPoint,
  currentPoint,
}: LiveRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const cameraRef = useRef<CameraRef | null>(null);
  const lastFollowTime = useRef(0);
  const lastAutoFitTime = useRef(0);
  const programmaticMove = useRef(false);
  const initialCameraSet = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [cameraMode, setCameraMode] = useState<LiveMapCameraMode>('follow_current');
  const modeRef = useRef(cameraMode);

  useEffect(() => {
    modeRef.current = cameraMode;
  }, [cameraMode]);

  const paused = recordingStatus === 'paused';
  const activityLabel = formatActivityType(activityType);
  const headerTitle = paused ? `${activityLabel} 기록 일시정지` : `${activityLabel} 기록 중`;
  const badgeText = paused ? 'PAUSED' : 'LIVE';
  const badgeColor = paused ? colors.warning : colors.primary;
  const followZoom = FOLLOW_ZOOM_BY_ACTIVITY[activityType];

  const routeGeoJson = useMemo(
    () => routeSegmentsToFeatureCollection(segments),
    [segments],
  );

  const allCoords = getAllCoordinates(segments);
  const canFitRoute = allCoords.length >= 2;

  const routeBounds = useMemo(
    () => calculateRouteBounds(segments),
    [segments],
  );
  const routeSpanM = useMemo(
    () => routeBounds ? calculateRouteSpanMeters(routeBounds) : 0,
    [routeBounds],
  );

  const showPlaceholder = !currentPoint;

  const initialViewState = useMemo(
    () => currentPoint
      ? { center: toLngLat(currentPoint), zoom: followZoom }
      : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const moveCamera = useCallback((fn: () => void) => {
    programmaticMove.current = true;
    fn();
    setTimeout(() => { programmaticMove.current = false; }, PROGRAMMATIC_MOVE_GUARD_MS);
  }, []);

  const handleFollowCurrent = useCallback(() => {
    if (!currentPoint) return;
    const now = Date.now();
    if (now - lastFollowTime.current < FOLLOW_THROTTLE_MS) return;
    lastFollowTime.current = now;

    moveCamera(() => {
      cameraRef.current?.easeTo({
        center: toLngLat(currentPoint),
        zoom: followZoom,
        duration: 400,
      });
    });
  }, [currentPoint, followZoom, moveCamera]);

  const handleAutoFitRoute = useCallback(() => {
    if (!routeBounds) return;
    const now = Date.now();
    if (now - lastAutoFitTime.current < AUTO_FIT_MIN_INTERVAL_MS) return;
    lastAutoFitTime.current = now;

    moveCamera(() => {
      cameraRef.current?.fitBounds(
        [routeBounds.west, routeBounds.south, routeBounds.east, routeBounds.north],
        { padding: FIT_PADDING, duration: 700 },
      );
    });
  }, [routeBounds, moveCamera]);

  // Set initial camera when first GPS point arrives after map ready
  useEffect(() => {
    if (currentPoint && mapReady && !initialCameraSet.current) {
      initialCameraSet.current = true;
      moveCamera(() => {
        cameraRef.current?.jumpTo({
          center: toLngLat(currentPoint),
          zoom: followZoom,
        });
      });
    }
  }, [currentPoint, mapReady, followZoom, moveCamera]);

  // Auto camera behavior based on mode
  useEffect(() => {
    if (!mapReady || !currentPoint || paused) return;

    if (cameraMode === 'follow_current') {
      const transitionDist = AUTO_FIT_TRANSITION_DISTANCE_M[activityType];
      if (routeSpanM > transitionDist && canFitRoute) {
        setCameraMode('fit_live_route');
        return;
      }
      handleFollowCurrent();
    } else if (cameraMode === 'fit_live_route') {
      handleAutoFitRoute();
    }
  }, [
    mapReady,
    currentPoint,
    cameraMode,
    routeSpanM,
    canFitRoute,
    paused,
    activityType,
    handleFollowCurrent,
    handleAutoFitRoute,
  ]);

  // Map error timeout
  useEffect(() => {
    if (!mapReady && !showPlaceholder) {
      const timer = setTimeout(() => {
        if (!mapReady) setMapError(true);
      }, 10_000);
      return () => clearTimeout(timer);
    }
  }, [mapReady, showPlaceholder]);

  const handleZoomIn = useCallback(async () => {
    setCameraMode('manual');
    const zoom = await mapRef.current?.getZoom();
    if (zoom === undefined) return;
    cameraRef.current?.zoomTo(Math.min(zoom + 1, MAX_ZOOM), { duration: 300 });
  }, []);

  const handleZoomOut = useCallback(async () => {
    setCameraMode('manual');
    const zoom = await mapRef.current?.getZoom();
    if (zoom === undefined) return;
    cameraRef.current?.zoomTo(Math.max(zoom - 1, MANUAL_MIN_ZOOM), { duration: 300 });
  }, []);

  const handleFitRoute = useCallback(() => {
    if (allCoords.length < 2) {
      if (currentPoint) {
        setCameraMode('follow_current');
        lastFollowTime.current = 0;
        handleFollowCurrent();
      }
      return;
    }
    setCameraMode('fit_live_route');
    lastAutoFitTime.current = 0;
    handleAutoFitRoute();
  }, [allCoords.length, currentPoint, handleFollowCurrent, handleAutoFitRoute]);

  const handleFollowPress = useCallback(() => {
    if (!currentPoint) return;
    setCameraMode('follow_current');
    lastFollowTime.current = 0;
    handleFollowCurrent();
  }, [currentPoint, handleFollowCurrent]);

  const handleRegionWillChange = useCallback(() => {
    if (mapReady && !programmaticMove.current && modeRef.current !== 'manual') {
      setCameraMode('manual');
    }
  }, [mapReady]);

  const gpsStatusText = getGpsStatusText(gpsState, paused);

  const placeholderText = (() => {
    if (gpsState === 'temporarily_degraded') return '정확한 위치를 확인하는 중이에요.';
    return '현재 위치를 확인하는 중이에요.\n위치가 확인되면 주변 지도를 자세히 보여드릴게요.';
  })();

  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>지도를 불러올 수 없어요.</Text>
        <Text style={styles.errorDescription}>위치 기록은 계속되고 있습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        attribution
        attributionPosition={{ bottom: 4, right: 4 }}
        compass={false}
        scaleBar={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onDidFailLoadingMap={() => setMapError(true)}
        onRegionWillChange={handleRegionWillChange}
      >
        <Camera
          ref={cameraRef}
          minZoom={MANUAL_MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          initialViewState={initialViewState}
        />

        {routeGeoJson.features.length > 0 ? (
          <GeoJSONSource id={ROUTE_SOURCE_ID} data={routeGeoJson}>
            <Layer
              type="line"
              id={ROUTE_LAYER_ID}
              source={ROUTE_SOURCE_ID}
              paint={{
                'line-color': colors.primary,
                'line-width': 5,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </GeoJSONSource>
        ) : null}

        {startPoint ? (
          <Marker lngLat={toLngLat(startPoint)}>
            <View style={styles.startMarker} />
          </Marker>
        ) : null}

        {currentPoint ? (
          <Marker lngLat={toLngLat(currentPoint)}>
            <View style={styles.currentMarkerOuter}>
              <View style={styles.currentMarkerInner} />
            </View>
          </Marker>
        ) : null}
      </Map>

      {showPlaceholder ? (
        <View style={styles.placeholderOverlay}>
          <Text style={styles.placeholderText}>{placeholderText}</Text>
        </View>
      ) : null}

      <View style={styles.headerOverlay}>
        <View style={styles.headerPill}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
        <View style={[styles.badgePill, { backgroundColor: paused ? colors.warningSoft : colors.primarySoft }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <Pressable
          style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
          onPress={handleZoomIn}
          accessibilityRole="button"
          accessibilityLabel="지도 확대"
          hitSlop={4}
        >
          <Plus size={18} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
          onPress={handleZoomOut}
          accessibilityRole="button"
          accessibilityLabel="지도 축소"
          hitSlop={4}
        >
          <Minus size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.bottomControlsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            !canFitRoute && styles.controlDisabled,
            pressed && styles.controlPressed,
          ]}
          onPress={handleFitRoute}
          disabled={!canFitRoute}
          accessibilityRole="button"
          accessibilityLabel="전체 이동 경로 보기"
          accessibilityHint="현재까지의 전체 이동 경로를 표시합니다."
          hitSlop={4}
        >
          <Scan size={18} color={canFitRoute ? colors.textPrimary : colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            cameraMode === 'follow_current' && styles.controlActive,
            pressed && styles.controlPressed,
          ]}
          onPress={handleFollowPress}
          accessibilityRole="button"
          accessibilityLabel="현재 위치를 자세히 보기"
          accessibilityHint="현재 위치 추적을 시작합니다."
          hitSlop={4}
        >
          <Locate size={18} color={cameraMode === 'follow_current' ? colors.primary : colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.gpsStatusOverlay}>
        <Text style={styles.gpsStatusText}>{gpsStatusText}</Text>
      </View>
    </View>
  );
}

function getGpsStatusText(gpsState: RecordingGpsState, paused: boolean): string {
  if (paused) return '일시정지';
  switch (gpsState) {
    case 'recording_normally':
      return 'GPS 정상';
    case 'temporarily_degraded':
      return 'GPS 신호 약함';
    case 'waiting_for_usable_fix':
      return 'GPS 신호 찾는 중';
    default:
      return 'GPS 정상';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  errorTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  errorDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerPill: {
    backgroundColor: 'rgba(13, 18, 26, 0.8)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
  },
  badgePill: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    position: 'absolute',
    right: spacing.sm,
    top: '40%',
    gap: spacing.xs,
  },
  bottomControlsContainer: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    gap: spacing.xs,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13, 18, 26, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlActive: {
    borderColor: colors.primary,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlPressed: {
    opacity: 0.7,
  },
  gpsStatusOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(13, 18, 26, 0.8)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  gpsStatusText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  startMarker: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  currentMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
});
