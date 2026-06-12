/**
 * database.js — MongoDB-backed persistence layer
 * ================================================
 * Drop-in replacement for the previous sql.js (SQLite/WASM) implementation.
 *
 * All exported function signatures are IDENTICAL to the previous version,
 * so no route files or middleware need any changes.
 *
 * Key mapping (SQLite column → MongoDB field):
 *   id            → legacyId   (integer, auto-incremented via counters collection)
 *   driver_name   → driverName
 *   ai_response   → aiResponse
 *   trip_date     → tripDate
 *   vehicle_type  → vehicleType
 *   social_caption→ socialCaption
 *   starting_location → startingLocation
 *   is_deleted    → isDeleted
 *   deleted_at    → deletedAt
 *   created_at    → createdAt
 *   firestore_id  → firestoreId
 *   user_id       → userId
 */

'use strict';

const mongo = require('./mongodb');

// ── Internal helpers ──────────────────────────────────────────

/** Convert a MongoDB narrative document to the snake_case shape the routes expect */
function toRow(doc) {
  if (!doc) return null;
  return {
    id:                doc.legacyId,
    driver_name:       doc.driverName,
    route:             doc.route,
    landmarks:         doc.landmarks         ?? null,
    highlights:        doc.highlights        ?? null,
    trip_date:         doc.tripDate          ?? null,
    vehicle_type:      doc.vehicleType       ?? 'Sedan',
    tone:              doc.tone              ?? 'Adventurous',
    style:             doc.style             ?? 'Adventure',
    prompt:            doc.prompt            ?? null,
    ai_response:       doc.aiResponse        ?? null,
    title:             doc.title             ?? null,
    summary:           doc.summary           ?? null,
    social_caption:    doc.socialCaption     ?? null,
    starting_location: doc.startingLocation  ?? null,
    destination:       doc.destination       ?? null,
    rating:            doc.rating            ?? null,
    comment:           doc.comment           ?? null,
    user_id:           doc.userId            ?? null,
    firestore_id:      doc.firestoreId       ?? null,
    is_deleted:        doc.isDeleted ? 1 : 0,
    deleted_at:        doc.deletedAt         ?? null,
    created_at:        doc.createdAt
      ? (doc.createdAt instanceof Date
          ? doc.createdAt.toISOString()
          : doc.createdAt)
      : null,
  };
}

/** Build a MongoDB filter for active (non-deleted) records */
function activeFilter(extra = {}) {
  return { isDeleted: { $ne: true }, ...extra };
}

// ── Lifecycle ─────────────────────────────────────────────────

/**
 * init() — Connect to MongoDB Atlas.
 * Called once at server startup (awaited before listen()).
 */
async function init() {
  await mongo.connect();
}

// ── Generations / Narratives ──────────────────────────────────

/**
 * insertGeneration({ driverName, route, ... }) → integer id
 * Inserts a new narrative document and returns its legacyId.
 */
async function insertGeneration({
  driverName, route, landmarks, highlights, tripDate,
  vehicleType, tone, prompt, aiResponse, title,
  summary, socialCaption, startingLocation, destination, style,
  userId = null, firestoreId = null,
}) {
  const legacyId  = await mongo.nextSequence('narrativeId');
  const now       = new Date();
  const coll      = mongo.getCollection('narratives');

  await coll.insertOne({
    legacyId,
    driverName,
    route,
    landmarks:        landmarks        ?? null,
    highlights:       highlights       ?? null,
    tripDate:         tripDate         ?? null,
    vehicleType:      vehicleType      ?? 'Sedan',
    tone:             tone             ?? 'Adventurous',
    style:            style            ?? 'Adventure',
    prompt:           prompt           ?? null,
    aiResponse:       aiResponse       ?? null,
    title:            title            ?? null,
    summary:          summary          ?? null,
    socialCaption:    socialCaption    ?? null,
    startingLocation: startingLocation ?? null,
    destination:      destination      ?? null,
    rating:           null,
    comment:          null,
    userId:           userId           ?? null,
    firestoreId:      firestoreId      ?? null,
    isDeleted:        false,
    deletedAt:        null,
    createdAt:        now,
  });

  return legacyId;
}

/**
 * updateFirestoreId(sqliteId, firestoreId)
 * Links a Firestore document ID to the MongoDB narrative record.
 */
async function updateFirestoreId(legacyId, firestoreId) {
  await mongo.getCollection('narratives').updateOne(
    { legacyId: Number(legacyId) },
    { $set: { firestoreId } }
  );
}

/**
 * getGenerations({ page, limit, search, userId }) → { data, total }
 * Returns a paginated list of active narratives.
 * data[] items use snake_case keys for backward compatibility.
 */
async function getGenerations({ page = 1, limit = 12, search = '', userId = null } = {}) {
  const coll   = mongo.getCollection('narratives');
  const filter = { isDeleted: { $ne: true } };

  if (userId) filter.userId = userId;

  // Regex-based search across driverName, route, title
  // ($text index not used — incompatible with serverApi.strict: true)
  if (search) {
    const rgx = { $regex: search, $options: 'i' };
    filter.$or = [
      { driverName: rgx },
      { route:      rgx },
      { title:      rgx },
    ];
  }

  const skip  = (page - 1) * limit;
  const total = await coll.countDocuments(filter);
  const docs  = await coll
    .find(filter, {
      projection: {
        aiResponse: 0, prompt: 0,  // exclude heavy fields from list view
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return { data: docs.map(toRow), total };
}

/**
 * getGeneration(id) → row | null
 * Returns a single active narrative by its integer legacyId.
 * Returns null for deleted or non-existent records.
 */
async function getGeneration(id) {
  const doc = await mongo.getCollection('narratives').findOne(
    activeFilter({ legacyId: Number(id) })
  );
  return toRow(doc);
}

/**
 * updateRating(id, rating, comment)
 * Saves a star rating and optional comment.
 */
async function updateRating(id, rating, comment) {
  await mongo.getCollection('narratives').updateOne(
    { legacyId: Number(id) },
    { $set: { rating: rating ?? null, comment: comment ?? null } }
  );
}

/**
 * deleteGeneration(id)
 * Soft-delete: marks as deleted but preserves the record.
 * isDeleted = true, deletedAt = now
 */
async function deleteGeneration(id) {
  await mongo.getCollection('narratives').updateOne(
    { legacyId: Number(id) },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
}

/**
 * restoreGeneration(id)
 * Restores a previously soft-deleted narrative.
 */
async function restoreGeneration(id) {
  await mongo.getCollection('narratives').updateOne(
    { legacyId: Number(id) },
    { $set: { isDeleted: false, deletedAt: null } }
  );
}

// ── Analytics ─────────────────────────────────────────────────

/**
 * getAnalytics() → { kpis, perDay, toneDistribution, topRoutes, ratingDist, topDrivers, recentHighRated }
 * Uses MongoDB aggregation pipelines — equivalent to the previous SQLite queries.
 */
async function getAnalytics() {
  const coll        = mongo.getCollection('narratives');
  const activeMatch = { $match: { isDeleted: { $ne: true } } };

  // Run all aggregations in parallel for performance
  const [
    kpiResult,
    perDay,
    toneDistribution,
    topRoutes,
    ratingDist,
    topDrivers,
    recentHighRated,
  ] = await Promise.all([

    // KPIs: total, avgRating, ratedCount
    coll.aggregate([
      activeMatch,
      {
        $group: {
          _id:        null,
          total:      { $sum: 1 },
          avgRating:  { $avg: '$rating' },
          ratedCount: {
            $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] },
          },
        },
      },
    ]).toArray(),

    // Per-day counts for last 30 days
    coll.aggregate([
      activeMatch,
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort:    { _id: 1 } },
      { $project: { _id: 0, day: '$_id', count: 1 } },
    ]).toArray(),

    // Tone distribution
    coll.aggregate([
      activeMatch,
      { $group: { _id: '$tone', count: { $sum: 1 } } },
      { $sort:    { count: -1 } },
      { $project: { _id: 0, tone: '$_id', count: 1 } },
    ]).toArray(),

    // Top 5 routes
    coll.aggregate([
      activeMatch,
      { $group: { _id: '$route', count: { $sum: 1 } } },
      { $sort:    { count: -1 } },
      { $limit:   5 },
      { $project: { _id: 0, route: '$_id', count: 1 } },
    ]).toArray(),

    // Rating distribution
    coll.aggregate([
      activeMatch,
      { $match:   { rating: { $ne: null } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort:    { _id: 1 } },
      { $project: { _id: 0, rating: '$_id', count: 1 } },
    ]).toArray(),

    // Top 5 drivers
    coll.aggregate([
      activeMatch,
      { $group: { _id: '$driverName', count: { $sum: 1 } } },
      { $sort:    { count: -1 } },
      { $limit:   5 },
      { $project: { _id: 0, driver_name: '$_id', count: 1 } },
    ]).toArray(),

    // Recent high-rated (≥4 stars)
    coll.find(
      activeFilter({ rating: { $gte: 4 } }),
      { projection: { legacyId: 1, driverName: 1, route: 1, title: 1, rating: 1, createdAt: 1 } }
    )
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray(),
  ]);

  const kpi = kpiResult[0] || { total: 0, avgRating: 0, ratedCount: 0 };

  return {
    kpis: {
      total:      kpi.total      ?? 0,
      avgRating:  kpi.avgRating  ? Number(kpi.avgRating.toFixed(1)) : 0,
      ratedCount: kpi.ratedCount ?? 0,
    },
    perDay,
    toneDistribution,
    topRoutes,
    ratingDist,
    topDrivers,
    recentHighRated: recentHighRated.map(d => ({
      id:          d.legacyId,
      driver_name: d.driverName,
      route:       d.route,
      title:       d.title,
      rating:      d.rating,
      created_at:  d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    })),
  };
}

// ── Admin ─────────────────────────────────────────────────────

/**
 * getAdminData({ page, limit, search, tone, rating }) → { data, total }
 * Paginated, filterable view for the admin panel.
 */
async function getAdminData({ page = 1, limit = 20, search = '', tone = '', rating = '' } = {}) {
  const coll   = mongo.getCollection('narratives');
  const filter = { isDeleted: { $ne: true } };

  if (search) {
    const rgx = { $regex: search, $options: 'i' };
    filter.$or = [
      { driverName: rgx },
      { route:      rgx },
      { title:      rgx },
    ];
  }
  if (tone)   filter.tone  = tone;
  if (rating) filter.rating = parseInt(rating, 10);

  const skip  = (page - 1) * limit;
  const total = await coll.countDocuments(filter);
  const docs  = await coll
    .find(filter, { projection: { aiResponse: 0, prompt: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return { data: docs.map(toRow), total };
}

/**
 * getAllForExport() → row[]
 * Returns all (non-deleted) records for CSV export.
 */
async function getAllForExport() {
  const docs = await mongo.getCollection('narratives')
    .find({ isDeleted: { $ne: true } }, {
      projection: { aiResponse: 0, prompt: 0 },
    })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toRow);
}

// ── Users (new — not exposed to existing routes, available for future use) ──

/**
 * upsertUser({ uid, email, displayName, photoURL, provider }) → void
 * Creates or updates a Firebase user profile in MongoDB.
 */
async function upsertUser({ uid, email, displayName, photoURL, provider }) {
  const now = new Date();
  await mongo.getCollection('users').updateOne(
    { uid },
    {
      $set:         { email, displayName, photoURL, provider, lastLogin: now },
      $setOnInsert: { createdAt: now, preferences: {} },
    },
    { upsert: true }
  );
}

/**
 * getUserByUid(uid) → user doc | null
 */
async function getUserByUid(uid) {
  return mongo.getCollection('users').findOne({ uid });
}

// ── Settings (new — available for future use) ─────────────────

/**
 * getSetting(key) → value | null
 */
async function getSetting(key) {
  const doc = await mongo.getCollection('settings').findOne({ key });
  return doc ? doc.value : null;
}

/**
 * setSetting(key, value) → void
 */
async function setSetting(key, value) {
  await mongo.getCollection('settings').updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date() } },
    { upsert: true }
  );
}

// ── Exports (identical to previous SQLite version + new helpers) ──
module.exports = {
  // Lifecycle
  init,

  // Narratives (identical signatures to old SQLite version)
  insertGeneration,
  updateFirestoreId,
  getGenerations,
  getGeneration,
  updateRating,
  deleteGeneration,
  restoreGeneration,
  getAnalytics,
  getAdminData,
  getAllForExport,

  // Users (new)
  upsertUser,
  getUserByUid,

  // Settings (new)
  getSetting,
  setSetting,
};
