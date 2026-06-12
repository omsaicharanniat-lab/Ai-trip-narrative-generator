require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db/database');

// Initialize Firebase Admin SDK at startup (logs status before routes)
require('./firebase/admin');

const generateRoute = require('./routes/generate');
const historyRoute  = require('./routes/history');
const feedbackRoute = require('./routes/feedback');
const analyticsRoute = require('./routes/analytics');
const adminRoute    = require('./routes/admin');
const suggestRoute  = require('./routes/suggest');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/generate',      generateRoute);
app.use('/api/history',       historyRoute);
app.use('/api/feedback',      feedbackRoute);
app.use('/api/analytics',     analyticsRoute);
app.use('/api/admin',         adminRoute);
app.use('/api/suggest-title', suggestRoute);

// Health check
app.get('/api/health', (_req, res) => {
  const { isReady } = require('./db/mongodb');
  res.json({
    status:    'ok',
    app:       'Manivtha AI Narrative Generator',
    version:   '2.0.0',
    database:  isReady() ? 'MongoDB Atlas ✅' : 'MongoDB ⚠️ not connected',
    timestamp: new Date().toISOString(),
  });
});

// ── SPA Fallback ────────────────────────────────────────────
// Serve login.html when explicitly requested
app.get('/login.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Serve index.html for all other non-API routes (SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start Server (init MongoDB first, then listen) ──────────
db.init().then(() => {
  app.listen(PORT, () => {
    const dbName = process.env.MONGODB_DB_NAME || 'ainarrative';
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   Manivtha AI Trip Narrative Generator       ║');
    console.log('║   Manivtha Tours & Travels — 2026            ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   🚀 Server : http://localhost:${PORT}          ║`);
    console.log(`║   🍃 DB     : MongoDB Atlas (${dbName})  ║`);
    console.log('╚══════════════════════════════════════════════╝\n');
  });
}).catch((err) => {
  console.error('❌ Failed to initialize MongoDB:', err.message);
  console.error('   → Check your MONGODB_URI in backend/.env');
  process.exit(1);
});
