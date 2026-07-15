const prisma = require('../config/db');

// Save a new refresh token in the database
function storeRefreshToken({ tokenHash, userId, expiresAt }) {
  return prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });
}

// Find a valid refresh token that is not expired or revoked
function findValidToken(tokenHash) {
  return prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });
}

// Revoke a specific refresh token
function revokeToken(tokenHash) {
  return prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

// Revoke all refresh tokens for a user
function revokeAllForUser(userId) {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });
}

module.exports = {
  storeRefreshToken,
  findValidToken,
  revokeToken,
  revokeAllForUser,
};