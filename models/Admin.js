const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  passwordResetOtpHash: {
    type: String,
  },
  passwordResetOtpExpiresAt: {
    type: Date,
  },
  passwordResetOtpAttempts: {
    type: Number,
    default: 0,
  },
  passwordResetTokenHash: {
    type: String,
  },
  passwordResetTokenExpiresAt: {
    type: Date,
  },
  passwordResetRequestedAt: {
    type: Date,
  },
  passwordResetVerifiedAt: {
    type: Date,
  },
  passwordUpdatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Admin', adminSchema);
