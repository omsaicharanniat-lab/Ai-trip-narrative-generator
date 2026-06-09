/**
 * Firebase Configuration
 * ──────────────────────────────────────────────────────────
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Go to Project Settings → General → Your apps → Add app (Web)
 * 4. Copy the firebaseConfig object and replace the values below
 * 5. In Firebase Console → Authentication → Sign-in method:
 *    - Enable "Google"
 *    - Enable "Email/Password"
 * 6. Add your admin email to backend/.env ADMIN_EMAILS
 * ──────────────────────────────────────────────────────────
 */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

// Backend API base URL — update if you deploy to a different host
const API_BASE = 'http://localhost:3001/api';

// Initialize Firebase
let firebaseApp = null;
try {
  if (FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    console.log('✅ Firebase initialized');
  } else {
    console.warn(
      '⚠️  Firebase not configured. Open frontend/js/config.js and fill in your Firebase project details.\n' +
      '   Admin features will be unavailable until Firebase is set up.'
    );
  }
} catch (e) {
  console.error('Firebase init error:', e);
}
