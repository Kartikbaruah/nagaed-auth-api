// Lightweight in-memory fake standing in for `../src/config/db` (Prisma).
// Keeps tests fast and DB-independent — no real MySQL needed to run
// `npm test`, which matters a lot for a reviewer who wants to run your
// tests in under a minute without provisioning a database first.

let users = [];
let refreshTokens = [];

function reset() {
  users = [];
  refreshTokens = [];
}

const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

const prismaMock = {
  user: {
    findUnique: async ({ where }) => {
      if (where.email) return users.find((u) => u.email === where.email) || null;
      if (where.username) return users.find((u) => u.username === where.username) || null;
      if (where.id) return users.find((u) => u.id === where.id) || null;
      return null;
    },
    create: async ({ data }) => {
      const user = { id: uuid(), createdAt: new Date(), updatedAt: new Date(), ...data };
      users.push(user);
      return user;
    },
  },
  refreshToken: {
    create: async ({ data }) => {
      const token = { id: uuid(), revoked: false, createdAt: new Date(), ...data };
      refreshTokens.push(token);
      return token;
    },
    findFirst: async ({ where }) => {
      return (
        refreshTokens.find(
          (t) => t.tokenHash === where.tokenHash && t.revoked === false && t.expiresAt > new Date()
        ) || null
      );
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      refreshTokens.forEach((t) => {
        if ((where.tokenHash && t.tokenHash === where.tokenHash) || (where.userId && t.userId === where.userId)) {
          Object.assign(t, data);
          count += 1;
        }
      });
      return { count };
    },
  },
  $disconnect: async () => {},
};

module.exports = { prismaMock, reset };
