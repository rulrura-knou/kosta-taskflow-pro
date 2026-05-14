const API_BASE = '';

// ─── 전역 상태 ────────────────────────────────────────────────────────────
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let isFirstLoad = true;

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
  try {
    tasks = await apiFetch('/api/tasks');
    isFirstLoad = false;
    renderTaskList();
  } catch {
    if (isFirstLoad) {
      isFirstLoad = false;
      document.getElementById('task-list').innerHTML = `
        <div class="col-span-full flex flex-col items-center py-20
                    text-red-400 dark:text-red-500 gap-2">
          <p class="text-sm">태스크를 불러오지 못했습니다.</p>
        </div>`;
    }
    // 폴링 에러는 무시 — 토스트 스팸 방지
  }
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
  todo:        { label: '할 일1',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { label: '진행 중', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  done:        { label: '완료',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
};

const FILTER_OPTIONS = [
  { value: 'all',         label: '전체' },
  { value: 'todo',        label: '할 일1' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'done',        label: '완료' },
];

// ─── 필터 + 정렬 ──────────────────────────────────────────────────────────

function getDisplayTasks() {
  let result = currentFilter === 'all'
    ? [...tasks]
    : tasks.filter(t => t.status === currentFilter);

  if (currentSort === 'newest') {
    result.sort((a, b) => b.id - a.id);
  } else if (currentSort === 'due_asc') {
    result.sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0;
      if (!a.due_at) return 1;   // 마감 없는 항목은 뒤로
      if (!b.due_at) return -1;
      return new Date(a.due_at) - new Date(b.due_at);
    });
  } else if (currentSort === 'status') {
    const ORDER = { todo: 0, in_progress: 1, done: 2 };
    result.sort((a, b) => (ORDER[a.status] ?? 0) - (ORDER[b.status] ?? 0));
  }

  return result;
}

function setFilter(value) {
  currentFilter = value;
  renderTaskList();
}

function setSort(value) {
  currentSort = value;
  renderTaskList();
}

// ─── 렌더 ─────────────────────────────────────────────────────────────────

function renderFilterTabs() {
  const container = document.getElementById('filter-tabs');
  container.innerHTML = FILTER_OPTIONS.map(({ value, label }) => {
    const count = value === 'all'
      ? tasks.length
      : tasks.filter(t => t.status === value).length;
    const active = currentFilter === value;
    const activeCls = active
      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
    const countCls = active
      ? 'text-blue-500 dark:text-blue-400'
      : 'text-slate-400 dark:text-slate-500';
    return `
      <button onclick="setFilter('${value}')"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCls}">
        ${label}<span class="ml-1 text-xs ${countCls}">${count}</span>
      </button>`;
  }).join('');
}

function renderTaskList() {
  renderFilterTabs();

  const container = document.getElementById('task-list');
  const displayed = getDisplayTasks();

  if (!displayed.length) {
    const activeLabel = FILTER_OPTIONS.find(f => f.value === currentFilter)?.label ?? '';
    const msg = currentFilter === 'all'
      ? '태스크가 없습니다. 새 태스크를 추가해 보세요.'
      : `'${activeLabel}' 상태의 태스크가 없습니다.`;
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center py-20
                  text-slate-400 dark:text-slate-500 gap-2">
        <span class="text-5xl">📋</span>
        <p class="text-sm">${msg}</p>
      </div>`;
    return;
  }

  container.innerHTML = displayed.map(renderCard).join('');
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

// ─── 토스트 ───────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const colorCls = type === 'success'
    ? 'bg-emerald-500 text-white'
    : 'bg-red-500 text-white';

  toast.className = [
    'px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto',
    'transition-all duration-300 ease-out',
    colorCls,
  ].join(' ');
  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  toast.textContent = message;

  container.appendChild(toast);

  // 다음 프레임에서 슬라이드 인
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── 버튼 로딩 상태 ───────────────────────────────────────────────────────

function setSubmitting(btn, isSubmitting) {
  btn.disabled = isSubmitting;
}

// ─── 추가 폼 ──────────────────────────────────────────────────────────────

async function handleAddSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('add-error');
  const btn = document.getElementById('add-btn');
  const title = document.getElementById('add-title').value.trim();
  const status = document.getElementById('add-status').value;
  const dueAtRaw = document.getElementById('add-due-at').value;

  if (!title) {
    showError(errEl, '제목을 입력해 주세요.');
    return;
  }
  hideError(errEl);

  setSubmitting(btn, true);
  try {
    await createTask({ title, status, due_at: toIsoString(dueAtRaw) });
    e.target.reset();
    showToast('태스크가 추가되었습니다.');
  } catch (err) {
    showError(errEl, '저장 실패: ' + formatApiError(err));
  } finally {
    setSubmitting(btn, false);
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
  const btn = document.getElementById('edit-save-btn');
  const id = Number(document.getElementById('edit-id').value);
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim() || null;
  const status = document.getElementById('edit-status').value;
  const dueAtRaw = document.getElementById('edit-due-at').value;

  if (!title) {
    showError(errEl, '제목을 입력해 주세요.');
    return;
  }

  setSubmitting(btn, true);
  try {
    await updateTask(id, { title, description, status, due_at: toIsoString(dueAtRaw) });
    closeEditModal();
    showToast('태스크가 수정되었습니다.');
  } catch (err) {
    showError(errEl, '저장 실패: ' + formatApiError(err));
  } finally {
    setSubmitting(btn, false);
  }
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────

async function confirmDelete(id) {
  if (!confirm('이 태스크를 삭제할까요?')) return;
  try {
    await deleteTask(id);
    showToast('태스크가 삭제되었습니다.');
  } catch {
    showToast('삭제에 실패했습니다.', 'error');
  }
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
  fetchTasks();
  setInterval(fetchTasks, 3_000);
}

// ─── 초기화 ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-form').addEventListener('submit', handleAddSubmit);
  syncThemeIcons(document.documentElement.classList.contains('dark'));
  startPolling();
});
