# nuni track

자전거, 산책, 러닝, 등산, 트레일러닝의 경로와 활동을 기록하는
Android·iPhone용 네이티브 앱입니다.

이 프로젝트는 웹앱이나 WebView 앱이 아닙니다. Expo/React Native로 Android와
iOS 네이티브 프로젝트를 생성하며 `platforms`도 Android와 iOS로만 제한했습니다.

## 포함 기능

- 활동 선택 후 기록 시작/종료
- 백그라운드 위치 추적
- 현재 속도와 러닝 페이스 표시
- 전체 시간, 활동 시간, 휴식 시간
- 활동 거리, 평균 속도, 최고 속도
- 올라간 높이, GPS 포인트 수
- 일시정지, 재개, 종료
- 위치 수신 즉시 SQLite 저장
- 완료 활동 목록
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

- 백그라운드 위치 기록은 Expo Go가 아니라 네이티브 개발 빌드에서 확인해야 합니다.
- 브랜드는 `nuni track`으로 바뀌었지만 기존 로컬 기록 호환을 위해 SQLite 파일명은 `nuni-life.db`를 유지합니다.
- 패키지명이 `kr.co.nuni.track`으로 바뀌었으므로 Google Cloud의 Android OAuth Client도 새 패키지명과 SHA-1으로 다시 만들어야 합니다.

```bash
npm run android
npm run ios
```

## 기록 흐름

```text
활동 기록 시작
→ 활동 유형 선택
→ GPS 준비 확인
→ 백그라운드 위치 서비스 시작
→ 위치 수신
→ 정확도와 비정상 속도 필터
→ SQLite에 포인트 저장
→ 대시보드 집계 갱신
→ 활동 종료
→ sync_queue 등록
→ 인터넷 연결 후 API 업로드
```

## 대시보드 지표

현재 속도, 러닝 페이스, 활동 거리, 전체 시간, 활동 시간, 휴식 시간,
평균 속도, 최고 속도, 올라간 높이, GPS 포인트 수를 표시합니다.

휴식 시간은 현재 `전체 시간 - 실제 이동으로 판정된 시간`입니다. 이동 판정의
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

업로드 payload에는 `activityType`이 포함됩니다. 예:

```json
{
  "record": {
    "activityType": "cycling"
  }
}
```

## 지도 설정 (MapLibre + OpenFreeMap)

지도 엔진은 MapLibre React Native를 사용하고, 지도 타일·스타일은 OpenFreeMap의 공개 다크 스타일을 사용합니다. 지도 데이터는 OpenStreetMap 기반입니다.

- API 키가 필요하지 않습니다.
- `.env`에 `EXPO_PUBLIC_MAP_STYLE_URL`을 설정하면 다른 MapLibre 호환 스타일로 교체할 수 있습니다.
- 비워두면 OpenFreeMap 다크 스타일(`https://tiles.openfreemap.org/styles/dark`)을 사용합니다.

OpenFreeMap 공개 인스턴스는 외부 공개 서비스이므로 장애나 정책 변화 가능성이 있습니다. 향후 자체 호스팅 OpenFreeMap, OpenMapTiles, 또는 다른 MapLibre 호환 타일 제공자로 교체할 수 있습니다.

```bash
npm run prebuild:clean
npm run android
```

> 지도 스타일 URL은 API 키가 아니므로 코드에 직접 작성해도 됩니다. `.env` 파일은 Git에 커밋하지 않습니다.

## 현재 범위와 제한

- Google 로그인, Apple 로그인, 사진·음성 저장, GPX 입출력은 포함하지 않았습니다.
- 기존 기록은 `unknown` 활동으로 호환 유지합니다.
- 데이터 초기화나 SQLite 삭제는 하지 않습니다.
- `메모 남기기`는 현재 UI 골격만 있고 DB 저장은 연결하지 않았습니다.

## DB 정보

- [DATABASE.md](docs/DATABASE.md)
