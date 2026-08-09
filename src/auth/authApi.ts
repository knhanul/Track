import { apiFetchJson, API_BASE_URL } from '../api/apiClient';
import type { AuthSessionResponse } from './types';

interface GoogleAuthRequest {
  idToken: string;
  platform: 'android' | 'ios';
  appVersion: string;
}

interface RefreshRequest {
  refreshToken: string;
}

export async function signInWithGoogleOnServer(
  payload: GoogleAuthRequest,
): Promise<AuthSessionResponse> {
  return apiFetchJson<AuthSessionResponse>(
    '/auth/google',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    { auth: false, retryOnUnauthorized: false },
  );
}

export async function refreshSessionOnServer(refreshToken: string): Promise<AuthSessionResponse> {
  return apiFetchJson<AuthSessionResponse>(
    '/auth/refresh',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken } as RefreshRequest),
    },
    { auth: false, retryOnUnauthorized: false },
  );
}

export async function logoutOnServer(accessToken: string | null): Promise<void> {
  if (!API_BASE_URL) return;

  try {
    await apiFetchJson<null>(
      '/auth/logout',
      {
        method: 'POST',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
      { auth: false, retryOnUnauthorized: false },
    );
  } catch {
    // 로컬 로그아웃은 계속 진행
  }
}
