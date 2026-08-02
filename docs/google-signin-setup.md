# Google Sign-In Setup (nuni track)

## 1) OAuth 동의 화면
- Google Cloud Console에서 OAuth 동의 화면을 생성합니다.
- 사용자 범위(scope)는 아래 3개만 사용합니다.
  - `openid`
  - `email`
  - `profile`
- 앱 이름은 `nuni track`으로 설정합니다.

## 2) Web OAuth Client 생성
- 같은 프로젝트에서 OAuth Client를 생성합니다.
- 타입: **Web application**
- 생성된 Client ID를 앱 환경변수로 사용합니다.
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=199651041375-2n6bfjj3up0pc5hi0aa7nb0254942m31.apps.googleusercontent.com`
- 이 값은 모바일 `configure({ webClientId })` 및 서버 `audience` 검증에 사용됩니다.

## 3) Android OAuth Client 생성
- 타입: **Android**
- package name: `kr.co.nuni.track`
- SHA fingerprint는 **SHA-1**을 등록해야 합니다.

### 개발 SHA-1 확인
```powershell
cd android
.\gradlew signingReport
```

출력된 SHA-1을 Android OAuth Client에 등록합니다.

## 4) 환경별 SHA-1 추가
아래 환경별 SHA-1이 다를 수 있으므로 모두 등록합니다.
- 로컬 debug APK
- 로컬 release APK
- EAS Build
- Google Play App Signing

각 환경 SHA-1을 Android OAuth Client에 추가 등록합니다.

## 5) iOS 준비 (선택)
- iOS OAuth Client를 별도로 생성합니다.
- `bundleIdentifier`와 reversed client ID를 맞춰야 합니다.
- iOS 빌드를 시작할 때 reversed client ID를 plugin/설정에 반영합니다.

## 6) 보안 주의사항
아래 값은 모바일 코드/환경에 넣지 않습니다.
- Google OAuth Client Secret
- 서버 JWT Secret
- DB 비밀번호
- refresh token signing secret

특히 `GOCSPX...` 형태 Client Secret은 모바일 앱에 넣지 않습니다.

## 7) Expo 설정 반영
`app.json` plugins에 다음이 포함되어야 합니다.
- `react-native-nitro-google-signin`
- `expo-secure-store`

MapLibre/Location/SQLite plugin은 유지해야 합니다.

## 8) 네이티브 재생성 및 빌드
native module/plugin 추가 후 Android prebuild + run이 필요합니다.

```powershell
npx expo prebuild --platform android --clean
npm run android
```

## 9) 점검 체크리스트
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 설정됨
- package `kr.co.nuni.track` 일치
- Android OAuth Client에 올바른 SHA-1 등록
- 서버 `GOOGLE_WEB_CLIENT_ID`와 mobile `webClientId` 동일
- 사용자 동작 전에는 계정 선택창이 자동 표시되지 않음
