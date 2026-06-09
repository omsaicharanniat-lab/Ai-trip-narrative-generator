const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, '../firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    // Dev mode: initialize without credentials (token verification will fail gracefully)
    console.warn(
      '⚠️  firebase-service-account.json not found.\n' +
      '   Admin routes will return 503 until Firebase is configured.\n' +
      '   See README.md for setup instructions.'
    );
  }
}

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization: Bearer <token> header and checks if the user's
 * email is in the ADMIN_EMAILS allow-list.
 */
async function verifyToken(req, res, next) {
  if (!admin.apps.length) {
    return res.status(503).json({
      error: 'Firebase Admin not configured. See backend/.env.example for setup.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    // Check admin email allow-list
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0 && !adminEmails.includes(decodedToken.email?.toLowerCase())) {
      return res.status(403).json({
        error: 'Access denied. Your account is not in the admin list.',
      });
    }

    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { verifyToken };
