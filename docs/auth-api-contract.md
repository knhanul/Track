# Auth API Contract (Mobile ↔ Server)

## POST /auth/google
Google 로그인 성공 직후 ID Token을 서버로 전달해 앱 세션 토큰을 발급받습니다.

### Request
```http
POST /auth/google
Content-Type: application/json
```

```json
{
  "idToken": "GOOGLE_ID_TOKEN",
  "platform": "android",
  "appVersion": "0.1.0"
}
```

### Response (200)
```json
{
  "user": {
    "id": "user_123",
    "email": "example@gmail.com",
    "name": "홍길동",
    "pictureUrl": "https://..."
  },
  "accessToken": "app_access_token",
  "refreshToken": "app_refresh_token",
  "accessTokenExpiresAt": 1799999999999
}
```

## POST /auth/refresh
refresh token으로 앱 세션을 갱신합니다.

### Request
```http
POST /auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "app_refresh_token"
}
```

### Response (200)
`POST /auth/google`와 동일한 세션 응답 타입

## POST /auth/logout
서버 세션 종료를 요청합니다.

### Request
```http
POST /auth/logout
Authorization: Bearer <app_access_token>
```

### Response
- `200` 또는 `204`
- 네트워크 실패여도 앱은 로컬 로그아웃을 완료해야 합니다.

## GET /auth/me (선택)
현재 access token 기준 사용자 정보를 조회합니다.

### Request
```http
GET /auth/me
Authorization: Bearer <app_access_token>
```

## 서버 검증 요구사항
서버는 Google ID Token에 대해 아래를 검증해야 합니다.
- Google 서명
- audience = `GOOGLE_WEB_CLIENT_ID`
- issuer
- expiration
- subject (`sub`)
- `email_verified`

사용자 식별은 `provider + providerSubject(sub)` 기준이어야 하며 이메일 단독 키를 사용하지 않습니다.
