export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

interface ApiFetchOptions {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

interface ApiAuthHandlers {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
  onAuthFailed(): Promise<void>;
}

let authHandlers: ApiAuthHandlers | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAuthHandlers(handlers: ApiAuthHandlers | null): void {
  authHandlers = handlers;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL_MISSING');
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  const auth = options.auth ?? false;
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

  if (auth) {
    const token = authHandlers?.getAccessToken();
    if (!token) {
      throw new Error('AUTH_TOKEN_MISSING');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (
    response.status === 401 &&
    auth &&
    retryOnUnauthorized &&
    authHandlers
  ) {
    const nextToken = await refreshAccessTokenOnce();
    if (!nextToken) {
      await authHandlers.onAuthFailed();
      return response;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${nextToken}`);
    return fetch(url, {
      ...init,
      headers: retryHeaders,
    });
  }

  return response;
}

export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await apiFetch(path, init, options);
  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, text || `HTTP ${response.status}`);
  }

  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!authHandlers) return null;
  if (!refreshPromise) {
    refreshPromise = authHandlers.refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
