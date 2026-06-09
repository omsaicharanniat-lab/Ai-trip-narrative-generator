/**
 * history.js — History View Logic
 * Loads, searches, paginates, and displays past narrative cards.
 * Clicking a card opens a modal with the full narrative.
 */

let historyPage = 1;
let historySearch = '';
let historyTotal = 0;

// ── Load History ───────────────────────────────────────────
async function loadHistory(page = 1, search = '') {
  historyPage = page;
  historySearch = search;

  const grid = document.getElementById('historyGrid');
  grid.innerHTML = '<div class="skeleton" style="height:180px;border-radius:18px;grid-column:1/-1;"></div>'.repeat(3);

  try {
    const params = new URLSearchParams({ page, limit: 12, search });
    const res = await fetch(`${API_BASE}/history?${params}`);
    const json = await res.json();

    historyTotal = json.pagination.total;
    document.getElementById('historyCount').textContent =
      `${historyTotal} ${historyTotal === 1 ? 'record' : 'records'} found`;

    if (json.data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No narratives yet</h3>
          <p>${search ? 'No results match your search.' : 'Generate your first travel story to see it here!'}</p>
        </div>`;
      document.getElementById('historyPagination').innerHTML = '';
      return;
    }

    grid.innerHTML = json.data.map(renderHistoryCard).join('');

    // Click handlers for cards
    grid.querySelectorAll('.history-card').forEach((card) => {
      card.addEventListener('click', () => openDetailModal(Number(card.dataset.id)));
    });

    renderPagination(
      json.pagination,
      'historyPagination',
      (p) => loadHistory(p, historySearch)
    );

  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Failed to load history: ${err.message}</p></div>`;
  }
}

// ── Card Renderer ──────────────────────────────────────────
function renderHistoryCard(item) {
  const date = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '';
  const rating = item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '';
  const title = item.title || `${item.route} — A Journey`;

  return `
  <div class="history-card" data-id="${item.id}" role="button" tabindex="0"
       aria-label="View narrative: ${escapeHtml(title)}">
    <div class="card-meta">
      <span class="card-date">${date}</span>
      <div class="card-badges">
        ${item.tone ? `<span class="badge badge-tone">${item.tone}</span>` : ''}
        ${item.vehicle_type ? `<span class="badge badge-vehicle">${item.vehicle_type}</span>` : ''}
      </div>
    </div>
    <div class="card-title">${escapeHtml(title)}</div>
    <div class="card-route">🗺️ ${escapeHtml(item.route || '')}</div>
    <div class="card-driver">👤 ${escapeHtml(item.driver_name || '')}</div>
    ${rating ? `<div class="card-rating">${rating}</div>` : ''}
  </div>`;
}

// ── Full Narrative Modal ───────────────────────────────────
async function openDetailModal(id) {
  const overlay = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = '<div class="skeleton" style="height:400px;border-radius:8px;"></div>';
  overlay.classList.add('open');

  try {
    const res = await fetch(`${API_BASE}/history/${id}`);
    const item = await res.json();
    const html = markdownToHtml(item.ai_response || '');
    const date = item.trip_date
      ? new Date(item.trip_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';

    body.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${item.tone ? `<span class="badge badge-tone">${item.tone}</span>` : ''}
        ${item.vehicle_type ? `<span class="badge badge-vehicle">${item.vehicle_type}</span>` : ''}
        <span class="badge" style="background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);">📅 ${date}</span>
      </div>
      <div style="margin-bottom:16px;font-size:13px;color:var(--text-muted);">
        🗺️ <strong style="color:var(--teal-light)">${escapeHtml(item.route)}</strong>
        &nbsp;·&nbsp; 👤 ${escapeHtml(item.driver_name)}
      </div>
      <div class="narrative-body">${html}</div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="copyModalText()">📋 Copy</button>
        <button class="btn btn-ghost btn-sm" onclick="downloadModalText('${id}')">📥 Download</button>
        ${item.rating ? `<span style="color:var(--accent);font-size:14px;">Rating: ${'★'.repeat(item.rating)}</span>` : ''}
      </div>`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--danger)">Failed to load: ${err.message}</p>`;
  }
}

function copyModalText() {
  const text = document.getElementById('modalBody').innerText;
  navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'success'));
}

function downloadModalText(id) {
  const text = document.getElementById('modalBody').innerText;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `narrative_${id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// ── Pagination Renderer ────────────────────────────────────
function renderPagination(pagination, containerId, onPageChange) {
  const container = document.getElementById(containerId);
  if (pagination.totalPages <= 1) { container.innerHTML = ''; return; }

  const { page, totalPages } = pagination;
  let html = '';

  if (page > 1) {
    html += `<button class="btn btn-ghost btn-sm" onclick="(${onPageChange.toString()})(${page - 1})">← Prev</button>`;
  }

  // Show up to 5 page numbers around current
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) {
    html += `<button class="btn btn-ghost btn-sm${p === page ? ' btn-secondary' : ''}" onclick="(${onPageChange.toString()})(${p})">${p}</button>`;
  }

  if (page < totalPages) {
    html += `<button class="btn btn-ghost btn-sm" onclick="(${onPageChange.toString()})(${page + 1})">Next →</button>`;
  }

  html += `<span class="current-page">Page ${page} of ${totalPages}</span>`;
  container.innerHTML = html;
}

// ── Search Input ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  let searchTimer;
  document.getElementById('historySearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadHistory(1, e.target.value.trim()), 400);
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

function closeModal() {
  document.getElementById('detailModal').classList.remove('open');
}

// ── Utility ───────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
