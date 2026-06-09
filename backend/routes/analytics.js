const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * GET /api/analytics
 * Returns aggregated analytics for the dashboard.
 */
router.get('/', (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

module.exports = router;
