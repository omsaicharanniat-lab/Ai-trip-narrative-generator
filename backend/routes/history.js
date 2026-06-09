const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * GET /api/history
 * Returns paginated list of past generations.
 * Query params: page (default 1), limit (default 12), search (optional)
 */
router.get('/', (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 12);
  const search = (req.query.search || '').trim();

  const { data, total } = db.getGenerations({ page, limit, search });

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/history/:id
 * Returns a single generation by ID (includes full ai_response).
 */
router.get('/:id', (req, res) => {
  const row = db.getGeneration(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Generation not found.' });
  res.json(row);
});

module.exports = router;
