import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  hasBackgroundPermission,
  hasForegroundPermission,
  hasLocationServicesEnabled,
} from '../../location/locationService';
import { API_BASE_URL } from '../../api/apiClient';

export interface SettingsStatus {
  locationServicesEnabled: boolean;
  foregroundPermissionGranted: boolean;
  backgroundPermissionGranted: boolean;
  cloudConfigured: boolean;
  loading: boolean;
}

interface SettingsStatusController {
  status: SettingsStatus;
  refresh(): Promise<void>;
}

const INITIAL_STATUS: SettingsStatus = {
  locationServicesEnabled: false,
  foregroundPermissionGranted: false,
  backgroundPermissionGranted: false,
  cloudConfigured: Boolean(API_BASE_URL),
  loading: true,
};

export function useSettingsStatus(): SettingsStatusController {
  const [status, setStatus] = useState<SettingsStatus>(INITIAL_STATUS);

  const refresh = useCallback(async () => {
    setStatus((previous) => ({ ...previous, loading: true }));

    try {
      const [locationServicesEnabled, foregroundPermissionGranted, backgroundPermissionGranted] =
        await Promise.all([
          hasLocationServicesEnabled(),
          hasForegroundPermission(),
          hasBackgroundPermission(),
        ]);

      setStatus({
        locationServicesEnabled,
        foregroundPermissionGranted,
        backgroundPermissionGranted,
        cloudConfigured: Boolean(API_BASE_URL),
        loading: false,
      });
    } catch {
      setStatus((previous) => ({
        ...previous,
        cloudConfigured: Boolean(API_BASE_URL),
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  return {
    status,
    refresh,
  };
}
