/**
 * app.js — SPA Router & Bootstrap
 * Manages view switching, URL hash routing, and lazy-loads data
 * for each view when it becomes active.
 */

const VIEWS = ['generate', 'history', 'analytics', 'admin'];

// ── Router ────────────────────────────────────────────────
function navigateTo(viewId) {
  if (!VIEWS.includes(viewId)) viewId = 'generate';

  // Update view visibility
  VIEWS.forEach((id) => {
    const viewEl = document.getElementById(`view-${id}`);
    const navEl  = document.getElementById(`nav-${id}`);
    if (viewEl) viewEl.classList.toggle('active', id === viewId);
    if (navEl)  navEl.classList.toggle('active', id === viewId);
  });

  // Update URL hash
  history.replaceState(null, '', `#${viewId}`);

  // Lazy-load view data
  switch (viewId) {
    case 'history':
      loadHistory(1, '');
      break;
    case 'analytics':
      loadAnalytics();
      break;
    case 'admin':
      // Admin data is loaded by onAuthChange if user is already signed in
      if (Auth.currentUser && typeof Admin.loadAdminData === 'function') {
        Admin.loadAdminData(1);
      }
      break;
  }
}

// ── Wire Navigation Links ──────────────────────────────────
document.querySelectorAll('.nav-link[data-view]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.view);
  });
});

// ── Handle Browser Back/Forward & Initial Load ─────────────
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '');
  navigateTo(hash || 'generate');
});

// ── Bootstrap on DOM ready ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const initialView = location.hash.replace('#', '') || 'generate';
  navigateTo(initialView);

  // Set today's date as default for tripDate
  const tripDateInput = document.getElementById('tripDate');
  if (tripDateInput && !tripDateInput.value) {
    tripDateInput.valueAsDate = new Date();
  }
});
