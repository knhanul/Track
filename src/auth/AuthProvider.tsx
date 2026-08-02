import Constants from 'expo-constants';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from 'react-native-nitro-google-signin';

import { ApiError, setApiAuthHandlers } from '../api/apiClient';
import { setSyncAuthStatus, triggerSyncNow } from '../sync/syncService';
import { refreshSessionOnServer, signInWithGoogleOnServer, logoutOnServer } from './authApi';
import { clearAuthSession, loadStoredAuthSession, saveAccessToken, saveAuthSession } from './authTokenStore';
import { isGoogleAuthConfigured } from './googleAuth';
import type { AuthSessionResponse, AuthStatus, AuthUser } from './types';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  errorMessage: string | null;
  initialize(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  retrySession(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialized = useRef(false);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  const clearSessionState = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    await clearAuthSession();
  }, []);

  const applySession = useCallback(async (session: AuthSessionResponse) => {
    accessTokenRef.current = session.accessToken;
    refreshTokenRef.current = session.refreshToken;
    setUser(session.user);
    await saveAuthSession(session);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) return null;

    try {
      const session = await refreshSessionOnServer(refreshToken);
      accessTokenRef.current = session.accessToken;
      refreshTokenRef.current = session.refreshToken;
      setUser(session.user);
      setStatus('signed_in');
      await saveAccessToken(session.accessToken, session.accessTokenExpiresAt);
      await saveAuthSession(session);
      return session.accessToken;
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        setStatus('offline_session');
        return null;
      }
      await clearSessionState();
      setStatus('signed_out');
      return null;
    }
  }, [clearSessionState]);

  useEffect(() => {
    setApiAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken,
      onAuthFailed: async () => {
        await clearSessionState();
        setStatus('signed_out');
      },
    });

    return () => {
      setApiAuthHandlers(null);
    };
  }, [clearSessionState, refreshAccessToken]);

  useEffect(() => {
    setSyncAuthStatus(status);
  }, [status]);

  const initialize = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;
    setStatus('initializing');
    setErrorMessage(null);

    try {
      const stored = await loadStoredAuthSession();
      if (!stored?.refreshToken) {
        setStatus('signed_out');
        return;
      }

      refreshTokenRef.current = stored.refreshToken;
      accessTokenRef.current = stored.accessToken;
      setUser(stored.user);

      try {
        const session = await refreshSessionOnServer(stored.refreshToken);
        await applySession(session);
        setStatus('signed_in');
      } catch (error) {
        if (isLikelyNetworkError(error)) {
          setStatus('offline_session');
        } else {
          await clearSessionState();
          setStatus('signed_out');
        }
      }
    } catch {
      setStatus('signed_out');
    }
  }, [applySession, clearSessionState]);

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      setStatus('signed_out');
      setErrorMessage('Google 로그인 설정이 완료되지 않았어요.');
      return;
    }

    setStatus('signing_in');
    setErrorMessage(null);

    try {
      await GoogleOneTapSignIn.checkPlayServices();

      let response = await GoogleOneTapSignIn.signIn();
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }

      if (isCancelledResponse(response)) {
        setStatus('signed_out');
        return;
      }

      if (!isSuccessResponse(response) || !response.data?.idToken) {
        setStatus('signed_out');
        setErrorMessage('Google 계정을 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.');
        return;
      }

      const appVersion = Constants.expoConfig?.version ?? '0.0.0';
      const session = await signInWithGoogleOnServer({
        idToken: response.data.idToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        appVersion,
      });

      await applySession(session);
      setStatus('signed_in');
      triggerSyncNow();
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        setStatus('signed_out');
        return;
      }

      const message = mapSignInError(error);
      setStatus('error');
      setErrorMessage(message);
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    const accessToken = accessTokenRef.current;

    await logoutOnServer(accessToken);

    try {
      await GoogleOneTapSignIn.signOut();
    } catch {
      // 로컬 로그아웃은 계속 진행
    }

    await clearSessionState();
    setStatus('signed_out');
    setErrorMessage(null);
  }, [clearSessionState]);

  const retrySession = useCallback(async () => {
    setErrorMessage(null);

    if (!refreshTokenRef.current) {
      setStatus('signed_out');
      return;
    }

    setStatus('initializing');
    try {
      const session = await refreshSessionOnServer(refreshTokenRef.current);
      await applySession(session);
      setStatus('signed_in');
      triggerSyncNow();
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        setStatus('offline_session');
        setErrorMessage('인터넷에 연결할 수 없어요.\n활동 기록은 계속 사용할 수 있습니다.');
      } else {
        await clearSessionState();
        setStatus('signed_out');
        setErrorMessage('세션이 만료되어 다시 로그인이 필요해요.');
      }
    }
  }, [applySession, clearSessionState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      errorMessage,
      initialize,
      signInWithGoogle,
      signOut,
      retrySession,
    }),
    [errorMessage, initialize, retrySession, signInWithGoogle, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

function isLikelyNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return false;
  if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_REQUIRED) {
    return false;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('internet') ||
      message.includes('timeout')
    );
  }
  return false;
}

function mapSignInError(error: unknown): string {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play 서비스를 사용할 수 없어요.\nPlay 서비스를 업데이트한 뒤 다시 시도해 주세요.';
    }

    if (error.code === statusCodes.DEVELOPER_ERROR) {
      return 'Google 로그인 설정을 확인해 주세요.\npackage, SHA-1, Web Client ID가 일치해야 합니다.';
    }
  }

  if (isLikelyNetworkError(error)) {
    return '인터넷에 연결할 수 없어요.\n활동 기록은 계속 사용할 수 있습니다.';
  }

  return 'Google 계정을 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.';
}
