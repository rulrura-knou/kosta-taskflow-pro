# 05-conventions.md — 개발 규약

---

## 명명 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 백엔드 변수·함수·파일명 | `snake_case` | `task_id`, `get_task_by_id`, `task_router.py` |
| 프론트엔드 변수·함수 | `camelCase` | `taskId`, `getTaskById`, `renderTaskList` |
| 컴포넌트·클래스 | `PascalCase` | `TaskCard`, `ModalDialog` |
| 코드 식별자 | **영어** | 변수명, 함수명, 파일명 모두 영어 |
| 주석 | **한국어** | `# 마감 초과 시 빨간색으로 강조` |

---

## 금지 목록

| 금지 | 이유 | 대안 |
|---|---|---|
| `print()` 디버깅 | 운영 로그에 노이즈 유발, 민감 정보 노출 위험 | `logging` 모듈 사용 (`logger.debug()`, `logger.info()`) |
| `bare except` (`except:`) | 모든 예외를 삼켜 디버깅 불가, 시스템 종료 신호까지 차단 | `except SpecificError as e:` 로 대상 예외 명시 |
| 비밀번호·토큰 하드코딩 | 코드 노출 시 즉각 보안 사고 | `.env` 파일 + `os.getenv("KEY")` 사용, `.gitignore`에 `.env` 추가 |
| `any` 타입 (TypeScript) | 타입 검사 무력화, 타입 시스템 의미 상실 | 명시적 타입 또는 `unknown` + 타입 가드 사용 |
| `!important` (CSS) | 우선순위 체계 붕괴, 유지보수 시 추적 불가 | 셀렉터 구체성 개선 또는 Tailwind 유틸리티 클래스로 대체 |

---

## 테스트 규약

- **프레임워크**: `pytest`
- **위치**: `backend/tests/` 폴더
- **파일명**: `test_<기능명>.py` (예: `test_tasks.py`)

### 필수 테스트 케이스

각 엔드포인트에 대해 다음 케이스를 작성한다.

| 케이스 | 설명 |
|---|---|
| 정상 동작 | 올바른 입력 → 기대 응답 코드 + 응답 바디 확인 |
| 400 Bad Request | `title` 누락 / 잘못된 `status` / `due_at` 형식 오류 |
| 404 Not Found | 존재하지 않는 `id`로 조회·수정·삭제 |

```python
# 예시
def test_create_task_success(client):
    res = client.post("/api/tasks", json={"title": "테스트 태스크"})
    assert res.status_code == 201

def test_create_task_missing_title(client):
    res = client.post("/api/tasks", json={})
    assert res.status_code == 400

def test_get_task_not_found(client):
    res = client.get("/api/tasks/9999")
    assert res.status_code == 404
```

---

## Git 커밋 규칙

### 타입 목록

| 타입 | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작성·수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드 설정, 패키지, 기타 잡무 |

### 형식

```
<타입>: <한국어 요약>
```

### 예시

```
feat: 태스크 생성 API 구현
fix: due_at 없는 경우 D-N 표시 오류 수정
docs: 02-specs.md API 응답 예시 추가
refactor: get_task 함수 중복 쿼리 제거
test: 태스크 삭제 404 케이스 추가
chore: requirements.txt pytest 추가
```

### 규칙

- 요약은 **한국어**로 작성한다.
- 현재형 동사로 끝낸다 (구현, 수정, 추가, 제거, 작성).
- 제목 50자 이내.
- 본문이 필요한 경우 한 줄 띄고 작성한다.
