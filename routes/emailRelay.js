const crypto = require('crypto');
const express = require('express');
const { sendPasswordResetOtpDirect } = require('../utils/email');

const router = express.Router();

const secretsMatch = (providedSecret, expectedSecret) => {
  if (!providedSecret || !expectedSecret) {
    return false;
  }

  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
};

router.post('/password-reset', async (req, res) => {
  try {
    const providedSecret = req.get('X-Email-Relay-Secret');

    if (!secretsMatch(providedSecret, process.env.EMAIL_RELAY_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const to = String(req.body.to || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const expiresInMinutes = Number(req.body.expiresInMinutes || 10);

    if (!to || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Valid email and OTP are required' });
    }

    await sendPasswordResetOtpDirect({ to, otp, expiresInMinutes });
    res.json({ message: 'Email sent' });
  } catch (error) {
    console.error('Email relay error:', error);
    res.status(500).json({ error: 'Unable to send email' });
  }
});

module.exports = router;
