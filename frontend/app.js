const API_BASE = '';

// 전역 상태
let tasks = [];

// ─── API ──────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) return Promise.reject(data);
  return data;
}

async function fetchTasks() {
  tasks = await apiFetch('/api/tasks');
  renderTaskList();
}

async function fetchTaskById(id) {
  return apiFetch(`/api/tasks/${id}`);
}

async function createTask(data) {
  await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
  await fetchTasks();
}

async function updateTask(id, data) {
  await apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  await fetchTasks();
}

async function deleteTask(id) {
  await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
  await fetchTasks();
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// D-N HH:MM 계산 — due_at이 없으면 null 반환
function formatDueAt(dueAtStr) {
  if (!dueAtStr) return null;
  const due = new Date(dueAtStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueStart - todayStart) / 86_400_000);
  const hhmm = due.toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  if (diffDays > 0) return { text: `D-${diffDays} ${hhmm}`, overdue: false };
  if (diffDays === 0) return { text: `D-0 ${hhmm}`, overdue: false };
  return { text: `D+${Math.abs(diffDays)} ${hhmm}`, overdue: true };
}

// datetime-local 입력값 → ISO 8601 문자열 (초 포함)
function toIsoString(datetimeLocalValue) {
  return datetimeLocalValue ? `${datetimeLocalValue}:00` : null;
}

// API 반환값 → datetime-local 입력 형식 (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
}

const STATUS_CONFIG = {
  todo:        { label: '할 일',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { label: '진행 중', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  done:        { label: '완료',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
};

// ─── 렌더 ─────────────────────────────────────────────────────────────────

function renderTaskList() {
  const container = document.getElementById('task-list');
  if (!tasks.length) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center py-20
                  text-slate-400 dark:text-slate-500 gap-2">
        <span class="text-5xl">📋</span>
        <p class="text-sm">태스크가 없습니다. 새 태스크를 추가해 보세요.</p>
      </div>`;
    return;
  }
  container.innerHTML = tasks.map(renderCard).join('');
}

function renderCard(task) {
  const s = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
  const due = formatDueAt(task.due_at);
  const dueHtml = due
    ? `<span class="text-xs font-medium ${due.overdue
        ? 'text-red-500 dark:text-red-400'
        : 'text-slate-400 dark:text-slate-400'}">${due.text}</span>`
    : '';

  return `
    <article class="relative flex flex-col gap-3 p-4 rounded-xl shadow-lg
                    bg-white/70 dark:bg-slate-800/70 backdrop-blur-md
                    border border-slate-200/60 dark:border-slate-700/60
                    cursor-pointer hover:shadow-xl transition-all duration-200"
             onclick="openEditModal(${task.id})">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100
                   leading-snug break-words">${escapeHtml(task.title)}</h3>
        <!-- 삭제 버튼 — 카드 클릭 이벤트 전파 차단 -->
        <button class="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center
                       -mr-2 -mt-1 text-slate-300 hover:text-red-500
                       dark:hover:text-red-400 transition-colors"
                onclick="event.stopPropagation(); confirmDelete(${task.id})"
                aria-label="삭제">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                     01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0
                     011-1h6a1 1 0 011 1v3"/>
          </svg>
        </button>
      </div>
      <div class="flex items-center justify-between mt-auto gap-2">
        <span class="inline-flex text-xs font-medium px-2.5 py-0.5
                     rounded-full ${s.cls}">${s.label}</span>
        ${dueHtml}
      </div>
    </article>`;
}

// ─── 추가 폼 ──────────────────────────────────────────────────────────────

async function handleAddSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('add-error');
  const title = document.getElementById('add-title').value.trim();
  const status = document.getElementById('add-status').value;
  const dueAtRaw = document.getElementById('add-due-at').value;

  if (!title) {
    showError(errEl, '제목을 입력해 주세요.');
    return;
  }
  hideError(errEl);

  const data = { title, status, due_at: toIsoString(dueAtRaw) };
  try {
    await createTask(data);
    e.target.reset();
  } catch (err) {
    showError(errEl, '저장 실패: ' + formatApiError(err));
  }
}

// ─── 수정 모달 ────────────────────────────────────────────────────────────

async function openEditModal(id) {
  const task = await fetchTaskById(id);
  document.getElementById('edit-id').value = task.id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description ?? '';
  document.getElementById('edit-status').value = task.status;
  document.getElementById('edit-due-at').value = toDatetimeLocal(task.due_at);
  hideError(document.getElementById('edit-error'));
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function saveEdit() {
  const errEl = document.getElementById('edit-error');
  const id = Number(document.getElementById('edit-id').value);
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim() || null;
  const status = document.getElementById('edit-status').value;
  const dueAtRaw = document.getElementById('edit-due-at').value;

  if (!title) {
    showError(errEl, '제목을 입력해 주세요.');
    return;
  }

  const data = { title, description, status, due_at: toIsoString(dueAtRaw) };
  try {
    await updateTask(id, data);
    closeEditModal();
  } catch (err) {
    showError(errEl, '저장 실패: ' + formatApiError(err));
  }
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────

async function confirmDelete(id) {
  if (!confirm('이 태스크를 삭제할까요?')) return;
  await deleteTask(id);
}

// ─── 테마 ─────────────────────────────────────────────────────────────────

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  syncThemeIcons(isDark);
}

function syncThemeIcons(isDark) {
  document.getElementById('icon-moon').classList.toggle('hidden', isDark);
  document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
}

// ─── 에러 표시 ────────────────────────────────────────────────────────────

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

function formatApiError(err) {
  if (Array.isArray(err?.detail)) {
    return err.detail.map(d => d.msg).join(', ');
  }
  return err?.detail ?? JSON.stringify(err);
}

// ─── 폴링 ─────────────────────────────────────────────────────────────────

function startPolling() {
  fetchTasks();                       // 즉시 1회 조회
  setInterval(fetchTasks, 3_000);     // 이후 3초마다 갱신
}

// ─── 초기화 ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-form').addEventListener('submit', handleAddSubmit);

  // 현재 테마에 맞게 아이콘 동기화
  syncThemeIcons(document.documentElement.classList.contains('dark'));

  startPolling();
});
