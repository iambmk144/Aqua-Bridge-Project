// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 4000);

let twilioClient;
try {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (e) {
  console.warn('Twilio client not initialized (missing package or env). If you only test locally this is ok for now.');
}

// Health
app.get('/', (req, res) => res.json({ ok: true, msg: 'Twilio OTP backend alive' }));

// Send OTP route
app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    if (process.env.TWILIO_VERIFY_SID && twilioClient) {
      const verification = await twilioClient.verify.services(process.env.TWILIO_VERIFY_SID)
        .verifications.create({ to: phone, channel: 'sms' });
      return res.json({ success: true, status: verification.status });
    }

    // Fallback (test only) — sends a dummy message if you set TWILIO_PHONE_NUMBER
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      const msg = await twilioClient.messages.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `Test OTP from Aqua Bridge: 123456`
      });
      return res.json({ success: true, sid: msg.sid });
    }

    return res.status(500).json({ error: 'Twilio not configured (check .env)' });
  } catch (err) {
    console.error('send-otp error', err?.message || err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

    if (!process.env.TWILIO_VERIFY_SID || !twilioClient) {
      return res.status(400).json({ error: 'Verify service not configured' });
    }
    const check = await twilioClient.verify.services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code });
    return res.json({ success: check.status === 'approved', status: check.status });
  } catch (err) {
    console.error('verify-otp error', err?.message || err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Twilio OTP server running on port ${port}`);
});
