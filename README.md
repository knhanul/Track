# nuni life Native Starter

일상 이동을 기록하는 Android·iPhone용 네이티브 앱 기본 소스입니다.

이 프로젝트는 웹앱이나 WebView 앱이 아닙니다. Expo/React Native로 Android와
iOS 네이티브 프로젝트를 생성하며 `platforms`도 Android와 iOS로만 제한했습니다.

## 포함 기능

- 일상 기록 시작
- 백그라운드 위치 추적
- 현재속도 대형 대시보드
- 전체시간, 이동시간, 휴식시간
- 이동거리, 평균속도, 최고속도
- 누적 상승고도, GPS 포인트 수
- 일시정지, 재개, 종료
- 위치 수신 즉시 SQLite 저장
- 완료 기록 목록
- 업로드 대기열
- 인터넷 복구 시 REST API 자동 동기화 골격
- Android Foreground Service 알림
- iOS Background Location 설정

## 개발 환경

- Node.js 22 이상
- Android Studio
- Android SDK 및 JDK
- iOS는 macOS와 Xcode 필요

## 최초 설치

Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup.ps1
npm run android
```

수동 실행:

```powershell
npm install
npm run setup:modules
npm run prebuild
npm run doctor
npm run android
```

macOS:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
npm run ios
```

## 중요한 실행 조건

백그라운드 위치 기록은 Expo Go가 아니라 네이티브 개발 빌드에서 확인해야 합니다.

```bash
npm run android
npm run ios
```

## 기록 흐름

```text
기록 시작
→ 스마트폰 UUID 생성
→ 백그라운드 위치 서비스 시작
→ 위치 수신
→ 정확도와 비정상 속도 필터
→ SQLite에 포인트 저장
→ 대시보드 집계 갱신
→ 기록 종료
→ sync_queue 등록
→ 인터넷 연결 후 API 업로드
```

## 대시보드 지표

현재속도, 이동거리, 전체시간, 이동시간, 휴식시간, 평균속도, 최고속도,
올라간 높이, GPS 포인트 수를 표시합니다.

휴식시간은 현재 `전체시간 - 실제 이동으로 판정된 시간`입니다. 이동 판정의
초기 기준은 1km/h이므로 실기기 테스트 후 조정해야 합니다.

## API 연결

`.env.example`을 `.env`로 복사합니다.

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

현재 동기화 API:

```http
POST /v1/life-records
Content-Type: application/json
Idempotency-Key: <record UUID>
```

인증 헤더는 아직 넣지 않았습니다. Google·Apple 로그인 구현 시 보안 토큰을
추가해야 합니다.

## 현재 범위와 제한

이 소스는 개발 시작용 골격입니다. Google·Apple 로그인, 서버 실제 구현,
PostgreSQL 마이그레이션, 지도, 사진·음성 저장, GPX 입출력은 포함하지 않았습니다.

`기억 남기기`는 현재 UI 골격만 있고 DB 저장은 연결하지 않았습니다.
