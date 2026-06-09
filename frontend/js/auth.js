/**
 * auth.js — Firebase Authentication
 * Handles Google Sign-In, Email/Password Sign-In, and Sign-Out.
 * Exposes: window.Auth { currentUser, getIdToken, isFirebaseReady }
 */

window.Auth = (() => {
  let currentUser = null;
  let authInitialized = false;

  function isFirebaseReady() {
    return !!firebaseApp;
  }

  // ── Auth State Change Listener ──────────────────────────
  if (isFirebaseReady()) {
    const auth = firebase.auth();

    auth.onAuthStateChanged((user) => {
      currentUser = user;
      authInitialized = true;
      updateSidebarUser(user);

      // If we're on the admin view, refresh admin panel state
      if (window.Admin && typeof window.Admin.onAuthChange === 'function') {
        window.Admin.onAuthChange(user);
      }
    });
  } else {
    authInitialized = true;
  }

  // ── Get Firebase ID Token (for backend auth) ────────────
  async function getIdToken() {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(/* forceRefresh= */ false);
    } catch (e) {
      console.error('Failed to get ID token:', e);
      return null;
    }
  }

  // ── Google Sign-In ──────────────────────────────────────
  async function signInWithGoogle() {
    if (!isFirebaseReady()) {
      showToast('Firebase not configured. Check frontend/js/config.js', 'error');
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  }

  // ── Email / Password Sign-In ────────────────────────────
  async function signInWithEmail(email, password) {
    if (!isFirebaseReady()) {
      showToast('Firebase not configured. Check frontend/js/config.js', 'error');
      return;
    }
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.error('Email sign-in error:', err);
      throw err;
    }
  }

  // ── Sign Out ────────────────────────────────────────────
  async function signOut() {
    if (!isFirebaseReady()) return;
    try {
      await firebase.auth().signOut();
      showToast('Signed out successfully', 'info');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  }

  // ── Update Sidebar User Display ─────────────────────────
  function updateSidebarUser(user) {
    const userInfo   = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName   = document.getElementById('userName');

    if (user) {
      userInfo.style.display = 'flex';
      userName.textContent = user.displayName || user.email || 'Admin';
      if (user.photoURL) {
        userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
      } else {
        userAvatar.textContent = (user.displayName || user.email || 'A')[0].toUpperCase();
      }
    } else {
      userInfo.style.display = 'none';
      userAvatar.textContent = '👤';
      userName.textContent = '';
    }
  }

  // ── Wire Logout Button ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logoutBtn')?.addEventListener('click', signOut);
  });

  return { get currentUser() { return currentUser; }, getIdToken, signInWithGoogle, signInWithEmail, signOut, isFirebaseReady };
})();
