const express = require('express');
const router  = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db/database');
const { buildTravelPrompt } = require('../utils/promptBuilder');

// ── Optional Firebase Admin (for token extraction) ────────────
let adminAuth = null;
try {
  const admin = require('firebase-admin');
  if (admin.apps.length) adminAuth = admin.auth();
} catch (_) {}

// ── Minimum quality thresholds ────────────────────────────────
const MIN_WORDS   = 150;
const MIN_CHARS   = 3000;
const MAX_RETRIES = 2;

// ── Helpers ───────────────────────────────────────────────────
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extract userId from optional Bearer token.
 * Non-blocking: returns null if token absent/invalid.
 */
async function extractUserId(req) {
  if (!adminAuth) return null;
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid || null;
  } catch (e) {
    console.warn('[generate] Token verification failed (non-fatal):', e.message);
    return null;
  }
}

/**
 * Parse AI response → { title, narrative }
 * Prompt instructs: Line 1 = plain title, Line 2 = blank, Lines 3+ = body.
 * Also handles legacy "# Title" format.
 */
function parseResponse(raw, fallbackRoute) {
  const lines = raw.split('\n');
  let titleLine = '';
  let bodyStart = 0;

  if (lines[0].startsWith('#')) {
    titleLine = lines[0].replace(/^#+\s*/, '').trim();
    bodyStart = lines[1] === '' ? 2 : 1;
  } else {
    titleLine = lines[0].trim();
    bodyStart = lines[1] === '' ? 2 : 1;
  }

  const title = titleLine || `${fallbackRoute} — A Journey to Remember`;

  let body = lines.slice(bodyStart).join('\n').trim();

  // Remove any accidental title repetition in the body
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  body = body
    .replace(new RegExp(`^#+\\s*${esc}\\s*$`, 'gmi'), '')
    .replace(new RegExp(`^\\*\\*${esc}\\*\\*\\s*$`, 'gmi'), '')
    .replace(new RegExp(`^${esc}\\s*$`, 'gmi'), '')
    .trim();

  // Convert ## subheadings to plain text
  body = body.replace(/^##\s+(.+)$/gm, '\n$1\n');

  return { title, narrative: body };
}

function validateNarrative(text) {
  const words = wordCount(text);
  const chars = text.length;
  return { valid: words >= MIN_WORDS && chars >= MIN_CHARS, words, chars };
}

/**
 * POST /api/generate
 * Generates an AI travel narrative from trip input fields.
 * Optionally accepts Authorization: Bearer <idToken> to associate with a user.
 */
router.post('/', async (req, res) => {
  const { driverName, route, landmarks, highlights, tripDate, vehicleType, tone } = req.body;

  if (!driverName || !route) {
    return res.status(400).json({ error: 'driverName and route are required fields.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({ error: 'Gemini API key not configured.' });
  }

  // Extract userId non-blocking
  const userId = await extractUserId(req);
  console.log(`[generate] userId=${userId || 'anonymous'}, route="${route}", tone="${tone}"`);

  const prompt = buildTravelPrompt({ driverName, route, landmarks, highlights, tripDate, vehicleType, tone });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model  = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 8192 },
  });

  let lastError = null;
  let title = null;
  let narrative = null;
  let qualityInfo = {};

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`[generate] Attempt ${attempt}/${MAX_RETRIES + 1}`);
      const result = await model.generateContent(prompt);
      const raw    = result.response.text();
      console.log(`[generate] Raw length: ${raw.length} chars`);

      const parsed = parseResponse(raw, route);
      title     = parsed.title;
      narrative = parsed.narrative;
      qualityInfo = validateNarrative(narrative);

      console.log(`[generate] Quality — words:${qualityInfo.words}, chars:${qualityInfo.chars}, valid:${qualityInfo.valid}`);

      if (qualityInfo.valid) break;

      console.warn(`[generate] Attempt ${attempt} below quality gate. Retrying…`);
      if (attempt <= MAX_RETRIES) await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      lastError = err;
      console.error(`[generate] Attempt ${attempt} error:`, err.message);
      if (attempt <= MAX_RETRIES) await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (lastError && !narrative) {
    return res.status(500).json({ error: 'AI generation failed after retries.', detail: lastError.message });
  }

  if (!qualityInfo.valid) {
    console.warn(`[generate] Quality gate not met — proceeding with best result.`);
  }

  try {
    const id = db.insertGeneration({
      driverName, route,
      landmarks:   landmarks   || null,
      highlights:  highlights  || null,
      tripDate:    tripDate    || null,
      vehicleType: vehicleType || 'Sedan',
      tone:        tone        || 'Adventurous',
      prompt,
      aiResponse:  narrative,
      title,
      userId,
    });

    console.log(`[generate] Saved — id=${id}, title="${title}", words=${qualityInfo.words}, chars=${qualityInfo.chars}, userId=${userId || 'null'}`);

    return res.json({
      id,
      title,
      narrative,
      userId,
      wordCount:  qualityInfo.words,
      charCount:  qualityInfo.chars,
      createdAt:  new Date().toISOString(),
    });
  } catch (dbErr) {
    console.error('[generate] SQLite save error:', dbErr);
    return res.status(500).json({ error: 'Failed to save narrative.', detail: dbErr.message });
  }
});

module.exports = router;
