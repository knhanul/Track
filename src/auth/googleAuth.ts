import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
let configured = false;

export function getGoogleWebClientId(): string {
  return webClientId;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(webClientId);
}

export function configureGoogleAuth(): void {
  if (configured || !webClientId) return;

  GoogleOneTapSignIn.configure({
    webClientId,
  });

  configured = true;
}
