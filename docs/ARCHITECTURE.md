# Architecture

```text
React Native UI
  ↓
useRecorder
  ↓
Location Service / SQLite Repository
  ↓
Android Foreground Location Service
iOS Core Location Background Mode
```

화면은 React Native 네이티브 컴포넌트로 렌더링되며 HTML 또는 WebView를
사용하지 않습니다. nuni track은 사용자가 명시적으로 시작한 야외활동만
기록합니다.

모든 GPS 포인트는 서버 전송 전에 SQLite에 저장합니다. `sync_queue`는
Outbox 패턴의 최소 구현입니다. 같은 기록 ID를 `Idempotency-Key`로 전송해
서버 중복 저장을 방지하도록 설계했습니다. `life_records.activity_type`은
`unknown` 레거시 값과 신규 활동 유형을 함께 지원합니다.

초기 위치 필터:
- 정확도 80m 초과 제외
- 계산 속도 180km/h 초과 점프 제외
- 이동 판정 1km/h 이상
- 고도 상승은 이전 포인트보다 1m 이상 높을 때 누적

활동 유형 정규화:
- cycling → 자전거
- walking → 산책
- running → 러닝
- hiking → 등산
- trail_running → 트레일러닝
- unknown → 레거시 기록용

프로덕션 전 장시간 실기기 기록, 배터리, 제조사 절전 정책, 권한 거부,
앱 강제 종료와 재부팅 복구를 반드시 검증해야 합니다.
