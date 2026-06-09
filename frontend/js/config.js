/**
 * config.js — Firebase & App Configuration
 * ─────────────────────────────────────────
 * Initializes Firebase compat SDK (loaded via CDN in index.html).
 * Uses getApp() / initializeApp() pattern to prevent duplicate-app errors.
 * Exposes: firebaseApp, firebaseAuth, firebaseDb, firebaseStorage
 *
 * Diagnostic logging is included so initialization failures are easy to trace.
 */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDVKDd6r-96ewW3dBBxEmF7VsvONifazBs",
  authDomain:        "ai-trip-narrative-generator.firebaseapp.com",
  projectId:         "ai-trip-narrative-generator",
  storageBucket:     "ai-trip-narrative-generator.firebasestorage.app",
  messagingSenderId: "70632204810",
  appId:             "1:70632204810:web:da3e6a8fb1efb9741b8df3",
  measurementId:     "G-Z1CDCVMX8K",
};

// Backend API base URL
const API_BASE = 'http://localhost:3001/api';

// ── Initialize Firebase (prevent duplicate-app errors) ────────
let firebaseApp     = null;
let firebaseAuth    = null;
let firebaseDb      = null;
let firebaseStorage = null;

(function initFirebase() {
  // Guard: ensure the Firebase SDK is available
  if (typeof firebase === 'undefined') {
    console.error('❌ [config] Firebase SDK not loaded. Check CDN script tags.');
    return;
  }

  try {
    // Re-use existing app if already initialized (prevents "duplicate app" error
    // when navigating between pages that both call initializeApp).
    try {
      firebaseApp = firebase.app();   // throws if no app exists
      console.log('[config] Re-using existing Firebase app.');
    } catch (_) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      console.log('[config] Firebase app initialized — project:', FIREBASE_CONFIG.projectId);
    }

    // ── Auth ─────────────────────────────────────────────────
    firebaseAuth = firebase.auth(firebaseApp);
    // Persist auth across page reloads / browser restarts
    firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => console.log('[config] Auth persistence: LOCAL'))
      .catch(e => console.warn('[config] setPersistence error:', e.message));

    // ── Firestore ─────────────────────────────────────────────
    if (typeof firebase.firestore === 'function') {
      firebaseDb = firebase.firestore(firebaseApp);
      firebaseDb.settings({ ignoreUndefinedProperties: true });
      console.log('[config] Firestore ready');
    } else {
      console.warn('[config] firebase-firestore-compat.js not loaded');
    }

    // ── Storage ───────────────────────────────────────────────
    if (typeof firebase.storage === 'function') {
      firebaseStorage = firebase.storage(firebaseApp);
      console.log('[config] Storage ready');
    } else {
      console.warn('[config] firebase-storage-compat.js not loaded');
    }

    console.log('✅ [config] Firebase fully initialized');

  } catch (e) {
    console.error('❌ [config] Firebase initialization FAILED:', e.code || e.message);
    console.error('   → Check: apiKey, authDomain, projectId in FIREBASE_CONFIG');
  }
})();
