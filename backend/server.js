require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db/database');

const generateRoute = require('./routes/generate');
const historyRoute = require('./routes/history');
const feedbackRoute = require('./routes/feedback');
const analyticsRoute = require('./routes/analytics');
const adminRoute = require('./routes/admin');

const app = express();
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
app.use('/api/generate', generateRoute);
app.use('/api/history', historyRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/admin', adminRoute);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Manivtha AI Narrative Generator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── SPA Fallback ────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start Server (init DB first, then listen) ───────────────
db.init().then(() => {
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   Manivtha AI Trip Narrative Generator       ║');
    console.log('║   Manivtha Tours & Travels — 2026            ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   🚀 Server : http://localhost:${PORT}          ║`);
    console.log(`║   📁 DB     : ${process.env.DB_PATH || './db/trips.db'}        ║`);
    console.log('╚══════════════════════════════════════════════╝\n');
  });
}).catch((err) => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
