/**
 * mongodb.js — Centralized MongoDB Atlas Connection Module
 * =========================================================
 * Manages a singleton MongoClient for the entire application.
 *
 * Usage:
 *   const { connect, getDb, close } = require('./mongodb');
 *   await connect();          // call once at startup
 *   const db = getDb();       // anywhere in the app
 *
 * Configuration (via .env):
 *   MONGODB_URI=mongodb+srv://...
 *   MONGODB_DB_NAME=ainarrative   (optional, defaults to 'ainarrative')
 */

'use strict';

const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');

// ── DNS Override ──────────────────────────────────────────────
// Some ISPs / corporate networks block DNS SRV queries (needed for mongodb+srv://).
// We override to Google's public DNS resolver which supports all record types.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


// ── Config ────────────────────────────────────────────────────
const URI     = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'ainarrative';

if (!URI) {
  console.error('❌ MONGODB_URI is not set in your .env file.');
}

// ── Singleton state ───────────────────────────────────────────
let client   = null;
let database = null;
let isConnected = false;

/**
 * Create a configured MongoClient (ServerApiVersion.v1, strict, deprecationErrors).
 */
function createClient() {
  return new MongoClient(URI, {
    serverApi: {
      version:            ServerApiVersion.v1,
      strict:             true,
      deprecationErrors:  true,
    },
    // Connection pool + timeout settings for production reliability
    maxPoolSize:          10,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS:     10000,
    socketTimeoutMS:      45000,
  });
}

/**
 * connect() — Establishes a connection to MongoDB Atlas and pings to verify.
 * Safe to call multiple times — returns immediately if already connected.
 */
async function connect() {
  if (isConnected && database) {
    return database;
  }

  if (!URI) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  console.log('🔌 Connecting to MongoDB Atlas…');

  try {
    client   = createClient();
    await client.connect();

    // Verify connectivity with a ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');

    database    = client.db(DB_NAME);
    isConnected = true;

    // Create indexes on first connection
    await ensureIndexes();

    console.log(`✅ MongoDB ready — database: "${DB_NAME}"`);
    return database;

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    isConnected = false;
    database    = null;
    throw err;
  }
}

/**
 * getDb() — Returns the active database instance.
 * Throws if connect() has not been called yet.
 */
function getDb() {
  if (!isConnected || !database) {
    throw new Error('MongoDB is not connected. Call connect() before getDb().');
  }
  return database;
}

/**
 * getCollection(name) — Convenience shorthand.
 */
function getCollection(name) {
  return getDb().collection(name);
}

/**
 * isReady() — Returns true if the connection is established.
 */
function isReady() {
  return isConnected && !!database;
}

/**
 * close() — Gracefully closes the MongoDB connection.
 * Call on process exit / SIGTERM.
 */
async function close() {
  if (client) {
    await client.close();
    isConnected = false;
    database    = null;
    client      = null;
    console.log('🔒 MongoDB connection closed.');
  }
}

/**
 * ensureIndexes() — Creates all required indexes on first connect.
 * Uses createIndex with background: false (MongoDB 4.4+ ignores the flag but keeps compat).
 */
async function ensureIndexes() {
  const db = database;

  // ── narratives collection ─────────────────────────────────────
  const narr = db.collection('narratives');

  await narr.createIndex({ legacyId: 1 },   { unique: true, name: 'legacyId_unique' });
  await narr.createIndex({ userId: 1 },     { name: 'userId_asc' });
  await narr.createIndex({ createdAt: -1 }, { name: 'createdAt_desc' });
  await narr.createIndex({ isDeleted: 1 },  { name: 'isDeleted_asc' });
  await narr.createIndex({ tone: 1 },       { name: 'tone_asc' });
  await narr.createIndex({ style: 1 },      { name: 'style_asc' });
  await narr.createIndex({ rating: 1 },     { name: 'rating_asc', sparse: true });

  // Individual field indexes to support regex-based search
  // (Text indexes are not supported with serverApi.strict: true in v1)
  await narr.createIndex({ driverName: 1 }, { name: 'driverName_asc' });
  await narr.createIndex({ route: 1 },      { name: 'route_asc' });
  await narr.createIndex({ title: 1 },      { name: 'title_asc' });


  // ── users collection ──────────────────────────────────────────
  const users = db.collection('users');
  await users.createIndex({ uid: 1 },   { unique: true, name: 'firebase_uid_unique' });
  await users.createIndex({ email: 1 }, { name: 'email_asc' });

  // ── settings collection ───────────────────────────────────────
  const settings = db.collection('settings');
  await settings.createIndex({ key: 1 }, { unique: true, name: 'settings_key_unique' });

  // ── counters collection ───────────────────────────────────────
  // (used for legacyId auto-increment; no special index needed beyond _id)

  console.log('✅ MongoDB indexes ensured.');
}

/**
 * nextSequence(name) — Atomically increments and returns the next integer sequence.
 * Used for legacyId (integer ID compatibility with existing frontend URLs).
 */
async function nextSequence(name) {
  const result = await getDb()
    .collection('counters')
    .findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
  return result.seq;
}

// ── Graceful shutdown hooks ───────────────────────────────────
process.on('SIGINT',  async () => { await close(); process.exit(0); });
process.on('SIGTERM', async () => { await close(); process.exit(0); });

module.exports = { connect, getDb, getCollection, isReady, close, nextSequence };
