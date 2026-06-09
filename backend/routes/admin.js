const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { verifyToken } = require('../middleware/verifyToken');

// All admin routes require Firebase auth token
router.use(verifyToken);

/**
 * GET /api/admin/data
 * Returns paginated raw generations data for the admin data viewer.
 */
router.get('/data', (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const search = (req.query.search || '').trim();
  const tone   = req.query.tone || '';
  const rating = req.query.rating || '';

  const { data, total } = db.getAdminData({ page, limit, search, tone, rating });

  res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    user: { email: req.user.email, name: req.user.name },
  });
});

/**
 * GET /api/admin/data/:id
 * Returns a single full generation record (including AI response + prompt).
 */
router.get('/data/:id', (req, res) => {
  const row = db.getGeneration(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Record not found.' });
  res.json(row);
});

/**
 * DELETE /api/admin/data/:id
 * Deletes a single generation record.
 */
router.delete('/data/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.getGeneration(id);
  if (!row) return res.status(404).json({ error: 'Record not found.' });
  db.deleteGeneration(id);
  res.json({ success: true, deleted: id });
});

/**
 * GET /api/admin/export
 * Returns all data as a CSV file download.
 */
router.get('/export', (req, res) => {
  const rows = db.getAllForExport();

  const headers = [
    'ID', 'Driver/Staff', 'Route', 'Landmarks', 'Highlights',
    'Trip Date', 'Vehicle Type', 'Tone', 'Title', 'Rating', 'Comment', 'Created At',
  ];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.id, r.driver_name, r.route, r.landmarks, r.highlights,
        r.trip_date, r.vehicle_type, r.tone, r.title,
        r.rating, r.comment, r.created_at,
      ]
        .map(escape)
        .join(',')
    ),
  ];

  const csvContent = csvLines.join('\r\n');
  const filename = `manivtha_generations_${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvContent); // BOM for Excel compatibility
});

/**
 * GET /api/admin/verify
 * Verifies the admin token and returns user info.
 */
router.get('/verify', (req, res) => {
  res.json({
    authenticated: true,
    user: {
      email: req.user.email,
      name: req.user.name || req.user.email,
      picture: req.user.picture,
    },
  });
});

module.exports = router;
