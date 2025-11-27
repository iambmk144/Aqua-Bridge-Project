// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import twilio from 'twilio';

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'aqua_bridge';
const HARVEST_COLLECTION = process.env.HARVEST_COLLECTION || 'harvest_requests';
const PRICES_COLLECTION = process.env.PRICES_COLLECTION || 'market_prices';

// Twilio config (from .env)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

const app = express();

// Middlewares (applied before any route)
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Basic health
app.get('/', (req, res) => res.json({ ok: true }));

// Setup Twilio client only if env provided
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn('Twilio environment variables not fully set. OTP sending will fail until configured.');
}

// In-memory OTP store for demo (replace with Redis for prod)
const otpStore = new Map(); // phone -> { code, expiresAt }
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// OTP endpoints
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const code = genOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phone, { code, expiresAt });

  if (!twilioClient) {
    // Twilio not configured. Return code for testing
    return res.json({ success: true, message: 'OTP generated (not sent - twilio not configured)', code });
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your AquaBridge verification code is ${code}`,
      from: TWILIO_PHONE,
      to: phone
    });
    return res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('Twilio send error', err);
    return res.status(500).json({ success: false, error: 'Failed to send SMS' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

  const entry = otpStore.get(phone);
  if (!entry) return res.status(400).json({ success: false, error: 'No code found' });

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ success: false, error: 'Code expired' });
  }

  if (entry.code !== code) {
    return res.status(400).json({ success: false, error: 'Invalid code' });
  }

  otpStore.delete(phone);
  // success -> in real app create session / token
  return res.json({ success: true, message: 'Verified' });
});

// ---------- MongoDB + Harvest + Market endpoints ----------
let client;
let db;
let harvestColl;
let pricesColl;

async function startDb() {
  if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  harvestColl = db.collection(HARVEST_COLLECTION);
  pricesColl = db.collection(PRICES_COLLECTION);
  console.log('Connected to MongoDB:', DB_NAME);
}

// MARKET STATUS (stored in a small "app_meta" collection)
app.get('/market-status', async (req, res) => {
  try {
    const doc = await db.collection('app_meta').findOne({ key: 'market_status' });
    const status = doc ? !!doc.value : true;
    return res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/market-status', async (req, res) => {
  try {
    const { isOpen } = req.body;
    await db.collection('app_meta').updateOne({ key: 'market_status' }, { $set: { value: !!isOpen } }, { upsert: true });
    return res.json({ success: true, status: !!isOpen });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// MARKET PRICES
app.get('/market-prices', async (req, res) => {
  try {
    const prices = await pricesColl.find().toArray();
    return res.json(prices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.patch('/market-prices', async (req, res) => {
  try {
    const { grade, price } = req.body;
    if (!grade || typeof price !== 'number') return res.status(400).json({ success: false, error: 'Invalid payload' });
    const existing = await pricesColl.findOne({ grade });
    const previousPrice = existing ? existing.price : null;
    const updated = { grade, price, previousPrice, updatedAt: new Date() };
    await pricesColl.updateOne({ grade }, { $set: updated }, { upsert: true });
    return res.json({ success: true, price: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// HARVEST REQUESTS (public endpoints used by frontend)
app.post('/harvest-requests', async (req, res) => {
  try {
    const data = req.body; // expect farmerId, grade, quantity, location
    if (!data.farmerId || !data.grade || !data.quantity) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const newReq = {
      ...data,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Pending Approval',
      timestamp: Date.now()
    };
    await harvestColl.insertOne(newReq);
    return res.status(201).json({ success: true, request: newReq });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/harvest-requests', async (req, res) => {
  try {
    const farmerId = req.query.farmerId ? String(req.query.farmerId) : null;
    const filter = farmerId ? { farmerId } : {};
    const requests = await harvestColl.find(filter).sort({ timestamp: -1 }).toArray();
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.patch('/harvest-requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Missing status' });
    const result = await harvestColl.findOneAndUpdate({ id }, { $set: { status } }, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ success: false, error: 'Request not found' });
    return res.json({ success: true, request: result.value });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Start DB then server (only here)
async function start() {
  try {
    await startDb();
    app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (client) await client.close();
  process.exit(0);
});
