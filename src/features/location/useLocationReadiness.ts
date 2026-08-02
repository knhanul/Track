import { useCallback, useEffect, useState } from 'react';

import {
  getCurrentLocationAccuracyM,
  hasBackgroundPermission,
  hasForegroundPermission,
  hasLocationServicesEnabled,
  requestBackgroundPermission,
  requestForegroundPermission,
} from '../../location/locationService';

export type LocationReadinessStatus =
  | 'checking'
  | 'ready'
  | 'permission_required'
  | 'background_permission_required'
  | 'location_service_disabled'
  | 'low_accuracy'
  | 'very_low_accuracy'
  | 'error';

const GOOD_ACCURACY_THRESHOLD_M = 30;
const LOW_ACCURACY_THRESHOLD_M = 100;

interface LocationReadinessState {
  status: LocationReadinessStatus;
  accuracyM: number | null;
  message: string;
}

interface LocationReadinessController extends LocationReadinessState {
  refreshing: boolean;
  refresh(): Promise<void>;
  requestForeground(): Promise<void>;
  requestBackground(): Promise<void>;
}

function buildMessage(status: LocationReadinessStatus, accuracyM: number | null): string {
  switch (status) {
    case 'checking':
      return '현재 위치를 확인하고 있어요.';
    case 'ready':
      return `현재 위치 정확도 ${Math.round(accuracyM ?? 0)}m`;
    case 'permission_required':
      return '야외활동의 경로와 속도를 기록하려면 위치 권한을 허용해 주세요.';
    case 'background_permission_required':
      return '화면이 꺼져도 진행 중인 야외활동 경로를 계속 기록할 수 있도록 항상 허용해 주세요.';
    case 'location_service_disabled':
      return '스마트폰의 위치 서비스를 켜 주세요.';
    case 'low_accuracy':
      return `현재 정확도 ${Math.round(accuracyM ?? 0)}m · 조금 더 기다려 주세요.`;
    case 'very_low_accuracy':
      return accuracyM != null
        ? `현재 정확도 ${Math.round(accuracyM)}m · GPS 신호가 매우 약해요.`
        : '현재 위치 정확도를 확인할 수 없어요.';
    case 'error':
    default:
      return '잠시 후 다시 시도해 주세요.';
  }
}

export function useLocationReadiness(): LocationReadinessController {
  const [status, setStatus] = useState<LocationReadinessStatus>('checking');
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setStatus('checking');

    try {
      const serviceEnabled = await hasLocationServicesEnabled();
      if (!serviceEnabled) {
        setAccuracyM(null);
        setStatus('location_service_disabled');
        return;
      }

      const foregroundGranted = await hasForegroundPermission();
      if (!foregroundGranted) {
        setAccuracyM(null);
        setStatus('permission_required');
        return;
      }

      const backgroundGranted = await hasBackgroundPermission();
      if (!backgroundGranted) {
        setAccuracyM(null);
        setStatus('background_permission_required');
        return;
      }

      const currentAccuracy = await getCurrentLocationAccuracyM();
      if (currentAccuracy === null) {
        setAccuracyM(null);
        setStatus('error');
        return;
      }

      setAccuracyM(currentAccuracy);
      if (currentAccuracy <= GOOD_ACCURACY_THRESHOLD_M) {
        setStatus('ready');
      } else if (currentAccuracy <= LOW_ACCURACY_THRESHOLD_M) {
        setStatus('low_accuracy');
      } else {
        setStatus('very_low_accuracy');
      }
    } catch {
      setAccuracyM(null);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const requestForeground = useCallback(async () => {
    await requestForegroundPermission();
    await refresh();
  }, [refresh]);

  const requestBackground = useCallback(async () => {
    await requestBackgroundPermission();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    accuracyM,
    message: buildMessage(status, accuracyM),
    refreshing,
    refresh,
    requestForeground,
    requestBackground,
  };
}
