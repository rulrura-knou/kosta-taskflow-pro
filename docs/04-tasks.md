# 04-tasks.md — MVP 작업 목록

## 진행 규칙

- **순서대로만** 진행한다. 이전 단계 검증 완료 전 다음 단계 시작 금지.
- **병렬 작업 금지** — 단계는 하나씩만 진행한다.
- **단계별 검증 필수** — 검증 방법을 통과한 후에만 완료로 표시한다.
- 확장 단계(JWT, Kanban, 채팅 등)는 이 문서에 포함하지 않는다. 별도 문서에서 다룬다.

---

## Phase 1 — 설계 (완료)

> CLAUDE.md 및 docs/ 6종 문서 작성. 코드 작성 전 프로젝트 전체 방향과 규칙을 확정한다.

| # | 작업 | 상태 | 검증 방법 |
|---|---|---|---|
| 1 | CLAUDE.md 빈 파일 생성 + `.gitignore` 작성 (`.claude/` 제외) | ✅ | `git status`에서 `.claude/` 미추적 확인 |
| 2 | GitHub 원격 저장소 연결 + 초기 커밋 푸시 | ✅ | `git remote -v`에서 origin URL 확인 |
| 3 | CLAUDE.md 내용 작성 (역할 / 절대규칙 5개 / 모호한 요청 처리) | ✅ | 파일 열어 5개 규칙 항목 존재 확인 |
| 4 | `docs/` 폴더 및 6개 파일 생성 | ✅ | `ls docs/`에서 6개 파일 목록 확인 |
| 5 | `docs/00-overview.md` 작성 (파일 매핑표, 읽는 순서, 분리 원칙) | ✅ | 파일 열어 매핑표 6행 존재 확인 |
| 6 | `docs/01-product.md` 작성 (목표, 페르소나, MVP 범위, 성공 기준) | ✅ | 성공 기준 표 5항목 존재 확인 |
| 7 | `docs/02-specs.md` 작성 (Task 모델, API 5종, 화면 명세) | ✅ | API 엔드포인트 5개 + 화면 명세 4종 확인 |
| 8 | `docs/03-design.md` 작성 (기술 결정 8개 표) | ✅ | 결정 표 8개 존재 확인 |
| 9 | `docs/04-tasks.md` 작성 (현재 문서) | ✅ | Phase 1~3 체크리스트 작성 완료 확인 |
| 10 | `docs/05-conventions.md` 작성 (개발 규약) | ⬜ | 브랜치 전략 + 커밋 규칙 항목 존재 확인 |

---

## Phase 2 — 백엔드

> FastAPI로 CRUD API 5개를 구현하고 Swagger UI에서 전 엔드포인트 동작을 확인한다.

| # | 작업 | 상태 | 검증 방법 |
|---|---|---|---|
| 1 | `backend/` 폴더 구조 생성 (`main.py`, `database.py`, `models.py`, `schemas.py`, `routers/`) | ⬜ | `ls backend/`에서 파일 목록 확인 |
| 2 | Python 가상환경 생성 + `requirements.txt` 작성 (FastAPI, Uvicorn, SQLAlchemy) | ⬜ | `pip list`에서 3개 패키지 설치 확인 |
| 3 | `database.py` 작성 — SQLite 엔진 + 세션 팩토리 + `Base` 정의 | ⬜ | `python -c "from database import engine"` 오류 없음 확인 |
| 4 | `models.py` 작성 — `Task` 모델 7개 필드 정의 + 테이블 생성 | ⬜ | 서버 기동 시 `tasks` 테이블 자동 생성 확인 (`taskflow.db`) |
| 5 | `schemas.py` 작성 — `TaskCreate`, `TaskUpdate`, `TaskResponse` Pydantic 스키마 | ⬜ | `python -c "from schemas import TaskCreate"` 오류 없음 확인 |
| 6 | `routers/tasks.py` 작성 — `POST /api/tasks` (201) 구현 | ⬜ | Swagger `/docs`에서 POST 호출 → 201 응답 확인 |
| 7 | `GET /api/tasks` (200, description 제외) + `GET /api/tasks/{id}` (200, description 포함) 구현 | ⬜ | 목록 응답에 `description` 없음 / 단건에 있음 확인 |
| 8 | `PUT /api/tasks/{id}` (200, 부분 수정) + `DELETE /api/tasks/{id}` (204) 구현 | ⬜ | PUT 부분 수정 후 기존 필드 유지 확인 / DELETE 후 204 확인 |
| 9 | 유효성 검증 적용 — `title` 누락 → 400, 잘못된 `status` → 400, `due_at` 형식 오류 → 400, 없는 id → 404 | ⬜ | 각 오류 케이스 Swagger에서 직접 호출해 응답 코드 확인 |
| 10 | CORS 설정 + 서버 기동 확인 + `git push` | ⬜ | `uvicorn main:app --reload` 실행 후 `/docs` 브라우저 접속 확인 |

---

## Phase 3 — 프론트엔드

> Vanilla JS + Tailwind CDN으로 메인 화면을 구성하고 백엔드 API에 연결한다.

| # | 작업 | 상태 | 검증 방법 |
|---|---|---|---|
| 1 | `frontend/` 폴더 생성 + `index.html` 기본 구조 + Tailwind CDN 연결 | ⬜ | 브라우저에서 `index.html` 열어 빈 화면 렌더링 + Tailwind 클래스 적용 확인 |
| 2 | 메인 화면 레이아웃 구현 (헤더, 태스크 영역, 테마 토글 버튼) | ⬜ | 360px / 768px / 1280px 너비에서 레이아웃 깨짐 없음 확인 |
| 3 | 태스크 추가 폼 구현 (`title` / `due_at` / `status`) + `POST /api/tasks` 연결 | ⬜ | 폼 제출 후 응답 201 + 네트워크 탭 확인 |
| 4 | 태스크 목록 구현 + `GET /api/tasks` 연결 + 3초 폴링 | ⬜ | 추가 후 목록에 카드 노출 + 3초마다 재조회 확인 (Network 탭) |
| 5 | 카드에 `status` 배지 + `D-N HH:MM` 마감 표시 구현 | ⬜ | `due_at` 있는 태스크에서 D-N 형식 올바르게 표시 확인 |
| 6 | 수정 모달 구현 + 카드 클릭 → 모달 열림 + `PUT /api/tasks/{id}` 연결 | ⬜ | 기존 값 채워진 상태로 모달 열림 + 저장 후 카드 즉시 갱신 확인 |
| 7 | 삭제 구현 (휴지통 아이콘 → 확인 다이얼로그 → `DELETE /api/tasks/{id}`) | ⬜ | 삭제 후 카드 목록에서 제거 + 응답 204 확인 |
| 8 | 라이트/다크 테마 토글 구현 + `localStorage('theme')` 저장 + 새로고침 후 테마 유지 확인 + `git push` | ⬜ | 토글 → 새로고침 → 동일 테마 유지 / 360px 화면 최종 확인 |
