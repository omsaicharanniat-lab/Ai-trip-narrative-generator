/**
 * admin.js — Admin Panel Logic
 * Handles Firebase auth wall, data table with filters/search,
 * CSV export, and record deletion.
 */

window.Admin = (() => {
  let adminPage = 1;
  let adminSearch = '';
  let adminTone = '';
  let adminRating = '';
  let idToken = null;

  // ── Auth Change (called by auth.js) ─────────────────────
  function onAuthChange(user) {
    const authWall    = document.getElementById('authWall');
    const adminContent = document.getElementById('adminContent');

    if (user) {
      authWall.style.display = 'none';
      adminContent.style.display = 'block';
      // Only load if admin view is currently active
      if (document.getElementById('view-admin').classList.contains('active')) {
        loadAdminData();
      }
    } else {
      authWall.style.display = 'flex';
      adminContent.style.display = 'none';
    }
  }

  // ── Wire Auth Buttons ────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Google Sign-In
    document.getElementById('googleSignInBtn').addEventListener('click', async () => {
      clearAuthError();
      try {
        await Auth.signInWithGoogle();
      } catch (err) {
        showAuthError(friendlyAuthError(err.code));
      }
    });

    // Email/Password Sign-In
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthError();
      const email    = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      const btn      = document.getElementById('emailSignInBtn');

      if (!email || !password) {
        showAuthError('Please enter your email and password.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        await Auth.signInWithEmail(email, password);
      } catch (err) {
        showAuthError(friendlyAuthError(err.code));
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });

    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);

    // Search + Filter
    let searchTimer;
    document.getElementById('adminSearch').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        adminSearch = e.target.value.trim();
        loadAdminData(1);
      }, 400);
    });

    document.getElementById('adminFilterTone').addEventListener('change', (e) => {
      adminTone = e.target.value;
      loadAdminData(1);
    });

    document.getElementById('adminFilterRating').addEventListener('change', (e) => {
      adminRating = e.target.value;
      loadAdminData(1);
    });
  });

  // ── Load Data Table ──────────────────────────────────────
  async function loadAdminData(page = adminPage) {
    adminPage = page;

    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;"><div class="skeleton" style="height:20px;border-radius:4px;"></div></td></tr>`;

    try {
      idToken = await Auth.getIdToken();
      if (!idToken) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--danger)">Not authenticated. Please sign in.</td></tr>`;
        return;
      }

      const params = new URLSearchParams({
        page, limit: 20,
        search: adminSearch,
        tone: adminTone,
        rating: adminRating,
      });

      const res = await fetch(`${API_BASE}/admin/data?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.status === 403) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--danger)">Access denied. Your email is not in the admin list.</td></tr>`;
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');

      const json = await res.json();
      document.getElementById('adminRecordCount').textContent =
        `${json.pagination.total} record${json.pagination.total !== 1 ? 's' : ''}`;

      if (json.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted)">No records found.</td></tr>`;
        document.getElementById('adminPagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = json.data.map((r) => `
        <tr>
          <td style="color:var(--text-muted);font-size:12px;">${r.id}</td>
          <td><strong>${escapeHtml(r.driver_name)}</strong></td>
          <td class="truncate-cell">${escapeHtml(r.route)}</td>
          <td class="truncate-cell">${escapeHtml(r.title || '—')}</td>
          <td><span class="badge badge-tone">${r.tone || '—'}</span></td>
          <td><span class="badge badge-vehicle">${r.vehicle_type || '—'}</span></td>
          <td style="font-size:12px;color:var(--text-muted)">${r.trip_date || '—'}</td>
          <td class="rating-stars">${r.rating ? '★'.repeat(r.rating) : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td style="font-size:12px;color:var(--text-muted)">${new Date(r.created_at).toLocaleDateString('en-IN')}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost btn-sm" onclick="Admin.viewRecord(${r.id})" aria-label="View record ${r.id}">👁️</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.deleteRecord(${r.id})" aria-label="Delete record ${r.id}">🗑️</button>
            </div>
          </td>
        </tr>`).join('');

      renderPagination(json.pagination, 'adminPagination', (p) => loadAdminData(p));

    } catch (err) {
      console.error('Admin data error:', err);
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--danger)">Error: ${err.message}</td></tr>`;
    }
  }

  // ── View Full Record ─────────────────────────────────────
  async function viewRecord(id) {
    const overlay = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = '<div class="skeleton" style="height:400px;border-radius:8px;"></div>';
    overlay.classList.add('open');

    try {
      idToken = await Auth.getIdToken();
      const res = await fetch(`${API_BASE}/admin/data/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const item = await res.json();
      const html = markdownToHtml(item.ai_response || '');

      body.innerHTML = `
        <div style="margin-bottom:16px;">
          <span class="badge badge-tone">${item.tone || ''}</span>
          <span class="badge badge-vehicle" style="margin-left:6px;">${item.vehicle_type || ''}</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          🗺️ <strong style="color:var(--teal-light)">${escapeHtml(item.route)}</strong>
          &nbsp;·&nbsp; 👤 ${escapeHtml(item.driver_name)}
          &nbsp;·&nbsp; 📅 ${item.trip_date || 'N/A'}
        </div>
        <div class="narrative-body">${html}</div>
        ${item.comment ? `<div style="margin-top:16px;padding:12px;background:var(--bg-card);border-radius:var(--radius-md);font-size:13px;color:var(--text-secondary);">💬 "${escapeHtml(item.comment)}"</div>` : ''}
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" onclick="copyModalText()">📋 Copy</button>
          <button class="btn btn-ghost btn-sm" onclick="downloadModalText('${id}')">📥 Download</button>
        </div>`;
    } catch (err) {
      body.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  }

  // ── Delete Record ────────────────────────────────────────
  async function deleteRecord(id) {
    if (!confirm(`Delete narrative #${id}? This cannot be undone.`)) return;

    try {
      idToken = await Auth.getIdToken();
      const res = await fetch(`${API_BASE}/admin/data/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      showToast(`Record #${id} deleted.`, 'success');
      loadAdminData(adminPage);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  }

  // ── Export CSV ───────────────────────────────────────────
  async function exportCsv() {
    try {
      idToken = await Auth.getIdToken();
      if (!idToken) { showToast('Not authenticated.', 'error'); return; }

      showToast('Preparing CSV export…', 'info');

      const res = await fetch(`${API_BASE}/admin/export`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manivtha_generations_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV downloaded successfully!', 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }

  // ── Auth Error Helpers ───────────────────────────────────
  function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.style.display = 'block';
  }
  function clearAuthError() {
    const el = document.getElementById('authError');
    el.textContent = '';
    el.style.display = 'none';
  }
  function friendlyAuthError(code) {
    const messages = {
      'auth/user-not-found':     'No account found with this email.',
      'auth/wrong-password':     'Incorrect password. Please try again.',
      'auth/invalid-email':      'Please enter a valid email address.',
      'auth/too-many-requests':  'Too many attempts. Please wait and try again.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return messages[code] || 'Sign-in failed. Please try again.';
  }

  // Public API
  return { onAuthChange, loadAdminData, viewRecord, deleteRecord };
})();
