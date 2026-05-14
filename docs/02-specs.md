# 02-specs.md — 기술 명세서

## Task 모델

### 필드 정의

| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PK, AUTO INCREMENT | 태스크 고유 식별자 |
| `title` | VARCHAR(200) | NOT NULL | 태스크 제목 (필수) |
| `description` | TEXT | NULL 허용 | 태스크 상세 설명 (선택) |
| `status` | ENUM | NOT NULL, 기본값 `todo` | `todo` / `in_progress` / `done` |
| `due_at` | DATETIME | NULL 허용, UTC 저장 | 마감시각 (선택). 표시: `2026-05-12 18:00` |
| `created_at` | DATETIME | NOT NULL, 자동 생성 | 생성 시각 (UTC) |
| `updated_at` | DATETIME | NOT NULL, 자동 갱신 | 최종 수정 시각 (UTC) |

### 상태값 (`status`)

```
todo        — 할 일 (기본값)
in_progress — 진행 중
done        — 완료
```

---

## 유효성 검증

| 조건 | 응답 |
|---|---|
| `title` 누락 또는 빈 문자열 | `400 Bad Request` |
| `status`가 허용값 외 값 | `400 Bad Request` |
| `due_at`가 ISO 8601 형식이 아닐 때 | `400 Bad Request` |
| 존재하지 않는 `id`로 조회·수정·삭제 | `404 Not Found` |

### `due_at` 허용 형식 (ISO 8601)

```
2026-05-12T18:00:00        # 로컬 시각
2026-05-12T18:00:00Z       # UTC 명시
2026-05-12T18:00:00+09:00  # 타임존 오프셋
```

---

## REST API

### 엔드포인트 목록

| 메서드 | 경로 | 설명 | 성공 응답 |
|---|---|---|---|
| `POST` | `/api/tasks` | 태스크 생성 | `201 Created` |
| `GET` | `/api/tasks` | 태스크 목록 조회 | `200 OK` |
| `GET` | `/api/tasks/:id` | 태스크 단건 조회 | `200 OK` |
| `PUT` | `/api/tasks/:id` | 태스크 수정 (부분 수정) | `200 OK` |
| `DELETE` | `/api/tasks/:id` | 태스크 삭제 | `204 No Content` |

> `PUT`은 전달된 필드만 수정한다. 누락된 필드는 기존 값을 유지한다.

---

### POST `/api/tasks` — 생성

**Request Body**
```json
{
  "title": "기획서 초안 작성",
  "description": "1차 검토용 초안",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00"
}
```

**Response `201`**
```json
{
  "id": 1,
  "title": "기획서 초안 작성",
  "description": "1차 검토용 초안",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00",
  "created_at": "2026-05-14T09:00:00",
  "updated_at": "2026-05-14T09:00:00"
}
```

---

### GET `/api/tasks` — 목록 조회

- `description` 필드는 **포함하지 않는다** (목록 성능 최적화).

**Response `200`**
```json
[
  {
    "id": 1,
    "title": "기획서 초안 작성",
    "status": "todo",
    "due_at": "2026-05-12T18:00:00",
    "created_at": "2026-05-14T09:00:00",
    "updated_at": "2026-05-14T09:00:00"
  }
]
```

---

### GET `/api/tasks/:id` — 단건 조회

- `description` 필드를 **포함한다**.

**Response `200`**
```json
{
  "id": 1,
  "title": "기획서 초안 작성",
  "description": "1차 검토용 초안",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00",
  "created_at": "2026-05-14T09:00:00",
  "updated_at": "2026-05-14T09:00:00"
}
```

---

### PUT `/api/tasks/:id` — 수정 (부분 수정)

**Request Body** (변경할 필드만 전달)
```json
{
  "status": "in_progress",
  "due_at": "2026-05-13T12:00:00"
}
```

**Response `200`** — 수정된 전체 태스크 반환 (`description` 포함)

---

### DELETE `/api/tasks/:id` — 삭제

**Response `204 No Content`** — Body 없음

---

## 화면 명세 (CRUD 4종 UI)

### 추가 — 태스크 생성 폼

| 입력 요소 | 타입 | 필수 여부 |
|---|---|---|
| `title` | 텍스트 입력 | 필수 |
| `due_at` | datetime-local 입력 | 선택 |
| `status` | 셀렉트박스 (`todo` / `in_progress` / `done`) | 필수 (기본값 `todo`) |

- 제출 시 `POST /api/tasks` 호출
- 성공 시 폼 초기화 및 목록 갱신

---

### 목록 — 태스크 카드

각 태스크를 카드로 표시한다.

| 카드 요소 | 표시 방식 |
|---|---|
| `title` | 카드 상단 텍스트 |
| `status` 배지 | `todo` / `in_progress` / `done` 색상 구분 |
| 마감까지 남은 시간 | `D-3 18:00` 형식 (날짜+시각) |
| 수정 진입 | 카드 클릭 → 수정 모달 열림 |
| 삭제 진입 | 카드 내 휴지통 아이콘 |

**D-N 계산 규칙**
- `due_at`이 없으면 표시하지 않는다.
- 오늘 마감이면 `D-0 HH:MM`
- 지난 마감이면 `D+N HH:MM` (빨간색 강조)

---

### 수정 — 모달

- 카드 클릭 시 수정 모달이 열린다.
- 기존 값이 폼에 채워진 상태로 열린다.
- `title`, `description`, `status`, `due_at` 수정 가능
- 저장 시 `PUT /api/tasks/:id` 호출
- 성공 시 모달 닫힘, 카드 즉시 갱신

---

### 삭제 — 확인 후 제거

1. 카드 내 휴지통 아이콘 클릭
2. 확인 다이얼로그 표시: "이 태스크를 삭제할까요?"
3. 확인 시 `DELETE /api/tasks/:id` 호출
4. 성공 시 목록에서 카드 제거 (`204` 응답)
