const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');
const { sendPasswordResetOtp } = require('../utils/email');

const router = express.Router();
const OTP_TTL_MINUTES = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10);
const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);
const MAX_OTP_ATTEMPTS = Number(process.env.PASSWORD_RESET_MAX_OTP_ATTEMPTS || 5);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const clearPasswordReset = (admin) => {
  admin.passwordResetOtpHash = undefined;
  admin.passwordResetOtpExpiresAt = undefined;
  admin.passwordResetOtpAttempts = 0;
  admin.passwordResetTokenHash = undefined;
  admin.passwordResetTokenExpiresAt = undefined;
  admin.passwordResetRequestedAt = undefined;
  admin.passwordResetVerifiedAt = undefined;
};

const signAccessToken = (admin) => jwt.sign(
  { id: admin._id, email: admin.email, name: admin.name },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

const signRefreshToken = (admin) => jwt.sign(
  { id: admin._id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email: normalizeEmail(email) });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = signAccessToken(admin);
    const refreshToken = signRefreshToken(admin);

    res.json({
      token,
      refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (
      admin.passwordUpdatedAt &&
      decoded.iat &&
      admin.passwordUpdatedAt.getTime() > decoded.iat * 1000
    ) {
      return res.status(401).json({ error: 'Password was changed. Please login again.' });
    }

    const token = signAccessToken(admin);

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const admin = await Admin.findOne({ email });
    const genericMessage = 'If an admin account exists for this email, an OTP has been sent.';

    if (!admin) {
      return res.json({ message: genericMessage });
    }

    const otp = createOtp();
    admin.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    admin.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    admin.passwordResetOtpAttempts = 0;
    admin.passwordResetTokenHash = undefined;
    admin.passwordResetTokenExpiresAt = undefined;
    admin.passwordResetRequestedAt = new Date();
    admin.passwordResetVerifiedAt = undefined;
    await admin.save();

    await sendPasswordResetOtp({
      to: admin.email,
      otp,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    res.json({ message: genericMessage, expiresInMinutes: OTP_TTL_MINUTES });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Unable to send reset OTP. Please try again later.' });
  }
});

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Enter the 6-digit OTP sent to your email' });
    }

    const admin = await Admin.findOne({ email });

    if (
      !admin ||
      !admin.passwordResetOtpHash ||
      !admin.passwordResetOtpExpiresAt ||
      admin.passwordResetOtpExpiresAt.getTime() < Date.now()
    ) {
      if (admin) {
        clearPasswordReset(admin);
        await admin.save();
      }
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    if (admin.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      clearPasswordReset(admin);
      await admin.save();
      return res.status(400).json({ error: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    const isValidOtp = await bcrypt.compare(otp, admin.passwordResetOtpHash);

    if (!isValidOtp) {
      admin.passwordResetOtpAttempts += 1;
      await admin.save();
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.passwordResetOtpHash = undefined;
    admin.passwordResetOtpExpiresAt = undefined;
    admin.passwordResetOtpAttempts = 0;
    admin.passwordResetTokenHash = hashResetToken(resetToken);
    admin.passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    admin.passwordResetVerifiedAt = new Date();
    await admin.save();

    res.json({
      message: 'OTP verified. You can now set a new password.',
      resetToken,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ error: 'Unable to verify OTP. Please try again later.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const resetToken = String(req.body.resetToken || '');
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const admin = await Admin.findOne({ email });
    const incomingTokenHash = hashResetToken(resetToken);

    if (
      !admin ||
      !admin.passwordResetTokenHash ||
      !admin.passwordResetTokenExpiresAt ||
      admin.passwordResetTokenExpiresAt.getTime() < Date.now() ||
      admin.passwordResetTokenHash !== incomingTokenHash
    ) {
      if (admin) {
        clearPasswordReset(admin);
        await admin.save();
      }
      return res.status(400).json({ error: 'Reset session is invalid or expired' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.passwordUpdatedAt = new Date();
    clearPasswordReset(admin);
    await admin.save();

    res.json({ message: 'Password updated successfully. Please sign in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Unable to update password. Please try again later.' });
  }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

module.exports = router;
