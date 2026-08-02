# nuni track Server Contract

## POST /v1/life-records

```http
Authorization: Bearer <access-token>
Idempotency-Key: <record UUID>
Content-Type: application/json
```

Body는 `record` 요약과 `points` 배열로 구성합니다. 서버는 기록 UUID와
Idempotency-Key를 이용해 재전송 시 중복 행을 만들지 않아야 합니다.

`record.activityType`은 정규화된 활동 코드만 허용합니다.

- `cycling`
- `walking`
- `running`
- `hiking`
- `trail_running`
- `unknown`(레거시 기록용)

신규 기록에서는 `unknown`을 거부하는 것을 권장합니다.

성공 응답 예:

```json
{
  "id": "record-uuid",
  "serverVersion": 1,
  "syncedAt": "2026-07-25T13:30:00Z"
}
```

예시 요청 바디:

```json
{
  "record": {
    "id": "record-uuid",
    "activityType": "cycling",
    "title": "8월 1일 자전거 기록",
    "distanceM": 28400
  }
}
```
