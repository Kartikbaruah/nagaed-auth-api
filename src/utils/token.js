const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate a new access token
function signAccessToken(payload) {
  // Add a unique ID to every token
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

// Generate a new refresh token
function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// Verify an access token
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Verify a refresh token
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// Hash a refresh token before storing it in the database
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

// Convert the expiry time into a JavaScript Date
function expiryToDate(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);

  // Use 7 days if the format is invalid
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  expiryToDate,
  REFRESH_EXPIRES_IN,
};