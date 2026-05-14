# 03-design.md — 기술 설계 결정

> **의존성 추가 정책**: 새 라이브러리·패키지 도입 전, 반드시 이 문서에 결정 사유를 먼저 기록한다.
> 사유가 없으면 도입 불가. PR에서 이 문서 업데이트 없이 `requirements.txt` / `package.json` 변경 시 반려한다.

---

## 결정 1 — 백엔드 프레임워크

| 항목 | 내용 |
|---|---|
| **선택** | FastAPI |
| **대안** | Django, Express(Node.js) |
| **근거** | 타입 힌트 기반 자동 검증, `/docs` Swagger 자동 생성, 비동기 지원, 경량 구조로 MVP 속도 최우선 |
| **트레이드오프** | Django 대비 ORM·Admin·Auth 내장 없음 → 직접 구성 필요. Express 대비 Python 생태계로 제한 |

---

## 결정 2 — 프론트엔드

| 항목 | 내용 |
|---|---|
| **선택** | Vanilla JS + Tailwind CSS CDN |
| **대안** | React, Vue |
| **근거** | 빌드 도구 불필요, CDN 한 줄로 즉시 사용 가능, 단일 HTML+JS 파일로 배포 단순화, 학습 곡선 없음 |
| **트레이드오프** | 컴포넌트 재사용성 낮음. 상태가 복잡해지면 수동 DOM 갱신 비용 증가. React/Vue 대비 생태계 지원 부족 |

---

## 결정 3 — 데이터베이스

| 항목 | 내용 |
|---|---|
| **선택** | SQLite (MVP) → PostgreSQL (확장 단계) + SQLAlchemy ORM |
| **대안** | MySQL, MongoDB |
| **근거** | SQLite는 파일 하나로 로컬 개발 즉시 시작 가능. SQLAlchemy로 추상화하면 DB 교체 시 코드 변경 최소화. PostgreSQL은 프로덕션 확장성 확보 |
| **트레이드오프** | SQLite는 동시 쓰기 제한(단일 writer). MongoDB는 스키마 유연성 있으나 관계형 쿼리 불편. MySQL은 PostgreSQL 대비 JSON/풀텍스트 지원 약함 |

---

## 결정 4 — CSS 방식

| 항목 | 내용 |
|---|---|
| **선택** | Tailwind CSS (CDN) 단독 사용 |
| **대안** | styled-components, CSS Modules, 순수 CSS |
| **근거** | 유틸리티 클래스로 HTML에서 직접 스타일 확인 가능. 빌드 없이 CDN 사용 가능. 디자인 토큰(`rounded-xl`, `shadow-lg` 등) 일관성 보장 |
| **트레이드오프** | HTML 클래스 문자열이 길어져 가독성 저하 가능. CDN 버전은 purge 미적용으로 파일 크기 큼(개발 단계 허용). styled-components는 JS 번들러 필요 → **금지** |

---

## 결정 5 — 실시간 데이터 동기화

| 항목 | 내용 |
|---|---|
| **선택** | 폴링 3초 간격 (MVP) |
| **대안** | WebSocket, SSE(Server-Sent Events) |
| **근거** | 구현 복잡도 최소화. MVP 성공 기준(CRUD 동작, 200ms 응답)에 실시간 연결 불필요. 3초 폴링은 10명 팀 규모에서 서버 부하 미미 |
| **트레이드오프** | 3초 지연으로 즉각적 동기화 불가. 트래픽 다소 낭비. WebSocket·SSE는 확장 단계로 보류 — 이 문서에 사유 기록 후 도입 가능 |

---

## 결정 6 — 프론트엔드 상태 관리

| 항목 | 내용 |
|---|---|
| **선택** | 모듈 변수 + DOM 직접 갱신 |
| **대안** | Redux, Zustand, Pinia, 전역 이벤트 버스 |
| **근거** | Vanilla JS 환경에서 외부 상태 라이브러리 불필요. 태스크 목록 단일 배열을 모듈 변수로 보관, 변경 시 `renderTaskList()` 직접 호출로 충분 |
| **트레이드오프** | 화면이 늘어나면 전역 변수 오염 위험. 단방향 흐름 강제 없음 → 개발자 규율 필요. 컴포넌트 간 공유 상태 증가 시 리팩터링 비용 발생 |

---

## 결정 7 — 디자인 시스템

| 항목 | 내용 |
|---|---|
| **선택** | Mac OS UI 톤 (자체 토큰) |
| **대안** | Material Design (MUI), Ant Design |
| **근거** | 외부 컴포넌트 라이브러리 없이 Tailwind 토큰만으로 일관성 확보. Mac OS 감성(둥근 모서리, 부드러운 그림자, 반투명)이 목표 UI 톤과 일치 |
| **트레이드오프** | Material·Ant 대비 접근성(a11y) 컴포넌트 직접 구현 필요. 디자인 일관성은 아래 토큰 목록으로 강제 |

### 디자인 토큰

| 토큰 | Tailwind 클래스 | 용도 |
|---|---|---|
| 모서리 | `rounded-xl` | 카드, 버튼, 입력창 |
| 그림자 | `shadow-lg` | 카드, 모달 |
| 반투명 배경 | `backdrop-blur-md` + `bg-white/70` | 카드 배경 |
| 폰트 | `font-sans` (시스템 폰트 스택) | 전체 텍스트 |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` | 버튼, 아이콘 클릭 영역 |

> **터치 타깃 44px** — WCAG 2.5.5 기준. 모바일 360px 반응형 필수 조건.

---

## 결정 8 — 테마 (라이트 / 다크)

| 항목 | 내용 |
|---|---|
| **선택** | Tailwind `dark:` 변형 + `localStorage('theme')` |
| **대안** | CSS 변수만 사용, 시스템 설정(`prefers-color-scheme`) 자동 추적 |
| **근거** | 사용자가 명시적으로 토글한 값을 우선한다. `localStorage`에 저장해 새로고침 후에도 유지. 시스템 설정은 초기값 참조에만 사용 |
| **트레이드오프** | `prefers-color-scheme` 자동 추적 안 함 → 시스템 테마 변경이 앱에 자동 반영되지 않음(의도적 결정) |

### 테마 초기화 로직

```javascript
// 1순위: localStorage 저장값
// 2순위: OS prefers-color-scheme
// 3순위: 기본값 light
const saved = localStorage.getItem('theme');
const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const theme = saved ?? system;
document.documentElement.classList.toggle('dark', theme === 'dark');
```

### 테마 토글

```javascript
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```
