import * as Location from 'expo-location';

import { LOCATION_TASK_NAME } from './backgroundLocationTask';

export async function hasLocationServicesEnabled(): Promise<boolean> {
  return Location.hasServicesEnabledAsync();
}

export async function hasForegroundPermission(): Promise<boolean> {
  const foreground = await Location.getForegroundPermissionsAsync();
  return foreground.status === 'granted';
}

export async function hasBackgroundPermission(): Promise<boolean> {
  const background = await Location.getBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function requestForegroundPermission(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  return foreground.status === 'granted';
}

export async function requestBackgroundPermission(): Promise<boolean> {
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function ensureTrackingReadyPermissions(): Promise<void> {
  const foregroundGranted = await hasForegroundPermission();
  if (!foregroundGranted) {
    throw new Error('정확한 기록을 위해 위치 권한을 허용해 주세요.');
  }

  const backgroundGranted = await hasBackgroundPermission();
  if (!backgroundGranted) {
    throw new Error(
      '화면이 꺼져도 기록하려면 설정에서 위치 권한을 항상 허용해 주세요.',
    );
  }
}

export async function getCurrentLocationAccuracyM(): Promise<number | null> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return typeof position.coords.accuracy === 'number'
    ? Math.max(0, position.coords.accuracy)
    : null;
}

export async function startBackgroundTracking(): Promise<void> {
  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 1,
    deferredUpdatesInterval: 3000,
    deferredUpdatesDistance: 5,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'nuni track 활동 기록 중',
      notificationBody: '야외활동의 이동 경로를 기기에 안전하게 저장하고 있어요.',
      notificationColor: '#2DD4BF',
    },
  });
}

export async function stopBackgroundTracking(): Promise<void> {
  const started =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
