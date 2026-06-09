const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * POST /api/feedback/link-firestore
 * Links a Firestore document ID back to the SQLite record.
 * Called non-blocking from the frontend after Firestore save succeeds.
 */
router.post('/link-firestore', (req, res) => {
  const { sqliteId, firestoreId } = req.body;
  if (!sqliteId || !firestoreId) {
    return res.status(400).json({ error: 'sqliteId and firestoreId are required.' });
  }
  try {
    db.updateFirestoreId(Number(sqliteId), firestoreId);
    res.json({ success: true });
  } catch (e) {
    console.error('[feedback/link-firestore] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/feedback/:id
 * Saves a star rating and optional comment for a generation.
 */
router.post('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const row = db.getGeneration(id);
  if (!row) return res.status(404).json({ error: 'Generation not found.' });

  db.updateRating(id, Math.round(rating), comment || null);

  res.json({ success: true, id, rating: Math.round(rating) });
});

module.exports = router;
