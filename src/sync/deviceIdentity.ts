import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLIENT_DEVICE_ID_KEY = 'nuni_track_client_device_id';

export interface DeviceRegistrationPayload {
  clientDeviceId: string;
  platform: 'android' | 'ios';
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  osVersion: string;
  appVersion: string;
}

export async function getOrCreateClientDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(CLIENT_DEVICE_ID_KEY);
  if (stored) return stored;

  const next = Crypto.randomUUID();
  await SecureStore.setItemAsync(CLIENT_DEVICE_ID_KEY, next);
  return next;
}

export async function buildDeviceRegistrationPayload(appVersion: string): Promise<DeviceRegistrationPayload> {
  const clientDeviceId = await getOrCreateClientDeviceId();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformConstants = Platform.constants as Record<string, unknown> | undefined;
  const constants = Constants as Record<string, unknown>;

  return {
    clientDeviceId,
    platform,
    deviceName: toStringOrNull(constants.deviceName) ?? toStringOrNull(platformConstants?.deviceName) ?? null,
    manufacturer: toStringOrNull(
      platformConstants?.Manufacturer ?? platformConstants?.manufacturer ?? platformConstants?.Brand ?? platformConstants?.brand,
    ),
    model: toStringOrNull(
      platformConstants?.Model ?? platformConstants?.model ?? platformConstants?.Device ?? platformConstants?.device,
    ),
    osVersion: String(Platform.Version ?? ''),
    appVersion,
  };
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
