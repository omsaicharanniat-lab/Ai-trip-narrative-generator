const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db/database');
const { buildTravelPrompt } = require('../utils/promptBuilder');

/**
 * POST /api/generate
 * Generates an AI travel narrative from trip input fields.
 */
router.post('/', async (req, res) => {
  const { driverName, route, landmarks, highlights, tripDate, vehicleType, tone } = req.body;

  // ── Validation ──────────────────────────────────────────
  if (!driverName || !route) {
    return res.status(400).json({
      error: 'driverName and route are required fields.',
    });
  }

  // ── Build Prompt ─────────────────────────────────────────
  const prompt = buildTravelPrompt({ driverName, route, landmarks, highlights, tripDate, vehicleType, tone });

  // ── Call Gemini API ──────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Extract title from the first # heading
    const titleMatch = aiResponse.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `${route} — A Journey to Remember`;

    // ── Save to SQLite ──────────────────────────────────────
    const id = db.insertGeneration({
      driverName,
      route,
      landmarks: landmarks || null,
      highlights: highlights || null,
      tripDate: tripDate || null,
      vehicleType: vehicleType || 'Sedan',
      tone: tone || 'Adventurous',
      prompt,
      aiResponse,
      title,
    });

    return res.json({
      id,
      title,
      narrative: aiResponse,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({
      error: 'AI generation failed. Please try again.',
      detail: err.message,
    });
  }
});

module.exports = router;
