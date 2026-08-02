import type { ActivityType } from '../../domain/activityType';

export type LiveMapCameraMode = 'follow_current' | 'fit_live_route' | 'manual';

export const FOLLOW_ZOOM_BY_ACTIVITY: Record<ActivityType, number> = {
  cycling: 16.5,
  walking: 17.5,
  running: 17.0,
  hiking: 16.5,
  trail_running: 16.5,
  unknown: 17.0,
};

export const MANUAL_MIN_ZOOM = 11;
export const MAX_ZOOM = 19;

export const FOLLOW_THROTTLE_MS = 1500;
export const AUTO_FIT_MIN_INTERVAL_MS = 6000;

export const FIT_PADDING = { top: 72, right: 48, bottom: 72, left: 48 };

export const AUTO_FIT_TRANSITION_DISTANCE_M: Record<ActivityType, number> = {
  cycling: 250,
  walking: 150,
  running: 150,
  hiking: 150,
  trail_running: 150,
  unknown: 150,
};

export function getSuggestedZoomForRouteSpan(
  spanM: number,
  activityType: ActivityType,
): number {
  if (spanM <= 100) return Math.max(FOLLOW_ZOOM_BY_ACTIVITY[activityType], 17);
  if (spanM <= 300) return 16.5;
  if (spanM <= 1000) return 15.5;
  if (spanM <= 3000) return 14.5;
  if (spanM <= 10000) return 13.5;
  return 12;
}
