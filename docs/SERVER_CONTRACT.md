# Minimal Server Contract

## POST /v1/life-records

```http
Authorization: Bearer <access-token>
Idempotency-Key: <record UUID>
Content-Type: application/json
```

Body는 `record` 요약과 `points` 배열로 구성합니다. 서버는 기록 UUID와
Idempotency-Key를 이용해 재전송 시 중복 행을 만들지 않아야 합니다.

성공 응답 예:

```json
{
  "id": "record-uuid",
  "serverVersion": 1,
  "syncedAt": "2026-07-25T13:30:00Z"
}
```
