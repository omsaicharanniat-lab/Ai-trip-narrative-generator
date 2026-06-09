/**
 * auth-gate.js — Route Protection & Auth Initialization
 * ───────────────────────────────────────────────────────
 * Must load BEFORE any other app JS (app.js, generate.js, etc.)
 *
 * Responsibilities:
 *  1. Wait for Firebase Auth to resolve the current session.
 *  2. If no user → redirect to /login.html.
 *  3. If user → expose window.currentUser and fire callbacks.
 *  4. Sync user profile to Firestore on first sign-in.
 *  5. Update nav avatar/name.
 *  6. Wire logout button.
 *
 * Exposes:
 *   window.currentUser     — Firebase user object (or null)
 *   window.getIdToken()    — returns Promise<string|null>
 *   window.onUserReady(cb) — registers a callback when user resolves
 */

(function initAuthGate() {
  const LOGIN_URL = '/login.html';

  // ── Auth-ready callbacks ────────────────────────────────────
  const _readyCallbacks = [];
  let   _resolved = false;
  window.currentUser = null;

  window.onUserReady = function (cb) {
    if (_resolved) { cb(window.currentUser); return; }
    _readyCallbacks.push(cb);
  };

  function _fireReady(user) {
    _resolved = true;
    window.currentUser = user;
    _readyCallbacks.forEach(cb => { try { cb(user); } catch (e) { console.error('onUserReady callback error:', e); } });
    _readyCallbacks.length = 0;
  }

  // ── getIdToken helper ───────────────────────────────────────
  window.getIdToken = async function (force = false) {
    if (!window.currentUser) return null;
    try { return await window.currentUser.getIdToken(force); }
    catch (e) { console.error('getIdToken error:', e); return null; }
  };

  // ── Auth-gated fetch (adds Bearer token) ───────────────────
  window.authFetch = async function (url, options = {}) {
    const token = await window.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  // ── Wait for Firebase auth module ──────────────────────────
  function waitForFirebase(attempts = 0) {
    if (typeof firebaseAuth !== 'undefined' && firebaseAuth) {
      attachListener();
    } else if (attempts < 50) {
      setTimeout(() => waitForFirebase(attempts + 1), 100);
    } else {
      console.error('[auth-gate] Firebase Auth not initialized — redirecting to login.');
      window.location.replace(LOGIN_URL);
    }
  }

  // ── Core auth state listener ────────────────────────────────
  function attachListener() {
    firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Not signed in → redirect to login
        console.log('[auth-gate] No user — redirecting to login.');
        window.location.replace(LOGIN_URL);
        return;
      }

      console.log(`[auth-gate] ✅ Signed in as: ${user.displayName || user.email} (${user.uid})`);

      // Sync profile to Firestore (non-blocking)
      if (window.FirestoreService) {
        FirestoreService.syncUserProfile(user).catch(e =>
          console.warn('[auth-gate] Firestore profile sync error:', e)
        );
      }

      // Update nav UI
      updateNavUser(user);

      // Fire all waiting callbacks
      _fireReady(user);
    });
  }

  // ── Update nav avatar & name ────────────────────────────────
  function updateNavUser(user) {
    const userInfo   = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName   = document.getElementById('userName');

    if (!userInfo) return;

    userInfo.style.display = 'flex';

    // Display name
    if (userName) {
      userName.textContent = user.displayName || user.email?.split('@')[0] || 'User';
    }

    // Avatar: photo or initial
    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar"
          style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
          referrerpolicy="no-referrer">`;
      } else {
        userAvatar.textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
        userAvatar.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;';
      }
    }
  }

  // ── Logout handler ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await firebaseAuth.signOut();
          window.currentUser = null;
          window.location.replace(LOGIN_URL);
        } catch (e) {
          console.error('[auth-gate] Sign-out error:', e);
        }
      });
    }
  });

  // ── Start ───────────────────────────────────────────────────
  // Wait until DOM is ready, then check Firebase
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForFirebase());
  } else {
    waitForFirebase();
  }
})();
