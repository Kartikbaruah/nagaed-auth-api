// LIVE integration tests — no mocking. This suite talks to the real
// Prisma client, which talks to real MySQL database (whatever
// DATABASE_URL in your .env points to).
//
// Run with: npm run test:live
// Requires: a running, migrated MySQL database (same setup as `npm run dev`).
//
// Each run uses a fresh, timestamped email so it never collides with a
// previous run, and afterAll() deletes the row it created so the
// database doesn't accumulate test users over time.

require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');

const stamp = Date.now();
const liveUser = {
  username: `live_test_${stamp}`,
  email: `live_test_${stamp}@example.com`,
  password: 'StrongPass1',
  address: '123 Real Database Lane, Guwahati',
};

let createdUserId;

afterAll(async () => {
  if (createdUserId) {
    await prisma.refreshToken.deleteMany({ where: { userId: createdUserId } });
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('LIVE — real MySQL, no mocks', () => {
  it('registers a real user row in the real database', async () => {
    const res = await request(app).post('/api/register').send(liveUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(liveUser.email);

    createdUserId = res.body.data.user.id;
  });

  it('logs in against the real database and receives real signed tokens', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: liveUser.email, password: liveUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects the wrong password against the real stored bcrypt hash', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: liveUser.email, password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('fetches the real profile from MySQL using a real JWT', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: liveUser.email, password: liveUser.password });

    const { accessToken, user } = loginRes.body.data;

    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(liveUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rotates the refresh token for real, backed by a real DB row', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: liveUser.email, password: liveUser.password });

    const { refreshToken } = loginRes.body.data;

    const refreshRes = await request(app).post('/api/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);

    // Reusing the now-rotated token must be rejected — this is checking
    // real rows in the real refresh_tokens table, not an in-memory fake.
    const reuseRes = await request(app).post('/api/refresh').send({ refreshToken });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('REFRESH_TOKEN_REVOKED');
  });
});
