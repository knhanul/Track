export type AuthStatus =
  | 'initializing'
  | 'signed_out'
  | 'signing_in'
  | 'signed_in'
  | 'offline_session'
  | 'error';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
}

export interface AuthSessionResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
}
