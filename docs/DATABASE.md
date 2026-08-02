# Database

nuni track은 SQLite를 로컬 저장소로 사용합니다.

- DB 파일명: `nuni-life.db`
- 호환 목적: 브랜드는 `nuni track`으로 바뀌었지만 기존 로컬 기록을 보존하기 위해 DB 파일명은 유지합니다.
- 초기화 방식: 앱 시작 시 `initializeDatabase()`가 실행되어 테이블을 생성하고, 필요한 경우 마이그레이션을 추가합니다.
- 파괴적 작업 금지: DB 파일 삭제, 테이블 삭제, 전체 초기화는 하지 않습니다.

## Tables

### `life_records`
기록 1건의 집계 정보를 저장합니다.

| column | type | notes |
| --- | --- | --- |
| `id` | TEXT | primary key |
| `title` | TEXT | 예: `8월 1일 자전거 기록` |
| `activity_type` | TEXT | `cycling`, `walking`, `running`, `hiking`, `trail_running`, `unknown` |
| `status` | TEXT | `recording`, `paused`, `completed` |
| `started_at_ms` | INTEGER | 시작 시각 |
| `ended_at_ms` | INTEGER | 종료 시각, 진행 중이면 null |
| `elapsed_ms` | INTEGER | 전체 경과 시간 |
| `moving_ms` | INTEGER | 실제 활동 시간 |
| `rest_ms` | INTEGER | 휴식 시간 |
| `distance_m` | REAL | 이동 거리 |
| `current_speed_kph` | REAL | 현재 속도 |
| `average_speed_kph` | REAL | 평균 속도 |
| `max_speed_kph` | REAL | 최고 속도 |
| `elevation_gain_m` | REAL | 올라간 높이 |
| `point_count` | INTEGER | 저장된 GPS 포인트 수 |
| `sync_status` | TEXT | `local_only`, `pending`, `syncing`, `synced`, `failed` |
| `created_at_ms` | INTEGER | 생성 시각 |
| `updated_at_ms` | INTEGER | 수정 시각 |

### `track_points`
각 GPS 샘플을 순서대로 저장합니다.

| column | type | notes |
| --- | --- | --- |
| `id` | TEXT | primary key |
| `record_id` | TEXT | `life_records.id` 참조 |
| `sequence_no` | INTEGER | 기록 내 순번 |
| `recorded_at_ms` | INTEGER | 수집 시각 |
| `latitude` | REAL | 위도 |
| `longitude` | REAL | 경도 |
| `altitude_m` | REAL | 고도 |
| `accuracy_m` | REAL | 정확도 |
| `speed_mps` | REAL | 원본 속도 |
| `heading` | REAL | 진행 방향 |

- Foreign key: `record_id -> life_records(id)`
- ON DELETE CASCADE: 기록을 삭제하면 포인트도 함께 삭제되도록 설계되어 있지만, 앱에서는 삭제 기능을 제공하지 않습니다.
- Unique constraint: 동일 기록에서 같은 시각/좌표 중복 저장 방지

### `sync_queue`
오프라인 업로드 대기열입니다.

| column | type | notes |
| --- | --- | --- |
| `id` | TEXT | primary key |
| `entity_type` | TEXT | 현재는 `life_record` |
| `entity_id` | TEXT | 업로드 대상 기록 ID |
| `operation` | TEXT | 현재는 `upsert` |
| `attempt_count` | INTEGER | 재시도 횟수 |
| `last_error` | TEXT | 마지막 오류 메시지 |
| `next_retry_at_ms` | INTEGER | 다음 재시도 시각 |
| `created_at_ms` | INTEGER | 생성 시각 |

### `app_settings`
앱 내부 상태를 보관합니다.

| column | type | notes |
| --- | --- | --- |
| `key` | TEXT | primary key |
| `value` | TEXT | 문자열 값 |

현재 사용하는 키:

- `active_record_id`
- `last_activity_type`

## Migration rules

- `life_records.activity_type`가 없으면 `ALTER TABLE`로 추가합니다.
- 기존 레코드는 `unknown`으로 유지합니다.
- 기존 활동을 임의로 산책/자전거 등으로 자동 분류하지 않습니다.
- 마이그레이션 실패 시 DB를 삭제하지 않고 오류를 남깁니다.

## Record flow

1. 사용자가 활동 유형을 선택합니다.
2. `createLifeRecord(activityType)`가 호출됩니다.
3. `life_records`에 새 행이 생성됩니다.
4. GPS 포인트는 `track_points`에 순차 저장됩니다.
5. 완료 시 `sync_queue`에 업로드 작업이 들어갑니다.
6. 네트워크가 복구되면 `syncService`가 업로드합니다.

## Sync payload

업로드 payload의 `record`에는 정규화된 `activityType`이 포함됩니다.

허용 값:

- `cycling`
- `walking`
- `running`
- `hiking`
- `trail_running`
- `unknown` (레거시 기록용)

신규 기록은 `unknown` 없이 저장하는 것을 권장합니다.
