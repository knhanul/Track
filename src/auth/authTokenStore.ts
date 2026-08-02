import * as SecureStore from 'expo-secure-store';

import type { AuthSessionResponse, AuthUser } from './types';

const ACCESS_TOKEN_KEY = 'nuni_track_access_token';
const REFRESH_TOKEN_KEY = 'nuni_track_refresh_token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'nuni_track_access_token_expires_at';
const AUTH_USER_KEY = 'nuni_track_auth_user';

export interface StoredAuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
}

export async function loadStoredAuthSession(): Promise<StoredAuthSession | null> {
  const [accessToken, refreshToken, expiresAtRaw, userRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
    SecureStore.getItemAsync(AUTH_USER_KEY),
  ]);

  if (!refreshToken || !userRaw) {
    return null;
  }

  const accessTokenExpiresAt = Number(expiresAtRaw ?? 0);
  const user = parseUser(userRaw);
  if (!user) return null;

  return {
    user,
    accessToken: accessToken ?? '',
    refreshToken,
    accessTokenExpiresAt: Number.isFinite(accessTokenExpiresAt) ? accessTokenExpiresAt : 0,
  };
}

export async function saveAuthSession(session: AuthSessionResponse): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY, String(session.accessTokenExpiresAt)),
    SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function saveAccessToken(accessToken: string, accessTokenExpiresAt: number): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY, String(accessTokenExpiresAt)),
  ]);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
  ]);
}

function parseUser(raw: string): AuthUser | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: typeof parsed.name === 'string' ? parsed.name : null,
      pictureUrl: typeof parsed.pictureUrl === 'string' ? parsed.pictureUrl : null,
    };
  } catch {
    return null;
  }
}
