const { prismaMock, reset } = require('./mockPrisma');

// Intercept the Prisma singleton BEFORE app.js (and everything downstream)
// requires it, so the whole app runs against the in-memory mock.
jest.mock('../src/config/db', () => require('./mockPrisma').prismaMock);

const request = require('supertest');
const app = require('../src/app');

const validUser = {
  username: 'kartik_dev',
  email: 'kartik@example.com',
  password: 'StrongPass1',
  address: '123 Main Street, Guwahati, Assam',
};

beforeEach(() => {
  reset();
});

describe('POST /api/register', () => {
  it('registers a new user and never returns the password hash', async () => {
    const res = await request(app).post('/api/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects a weak password with a 400 and a consistent error shape', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validUser, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects duplicate email with 409 CONFLICT', async () => {
    await request(app).post('/api/register').send(validUser);
    const res = await request(app)
      .post('/api/register')
      .send({ ...validUser, username: 'someoneElse' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app).post('/api/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/register').send(validUser);
  });

  it('logs in with correct credentials and returns access + refresh tokens', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rejects wrong password with generic 401 (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects login for a non-existent email with the SAME error code/message as wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ghost@example.com', password: 'WhoKnows1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/users/:id (protected)', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/users/some-id');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app).get('/api/users/some-id').set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns the user profile for a valid token and matching id', async () => {
    await request(app).post('/api/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    const { accessToken, user } = loginRes.body.data;

    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects fetching a DIFFERENT user\'s profile even with a valid token', async () => {
    await request(app).post('/api/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('FORBIDDEN_RESOURCE');
  });
});

describe('POST /api/refresh', () => {
  it('issues a new token pair and rotates the old refresh token', async () => {
    await request(app).post('/api/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    const { refreshToken } = loginRes.body.data;

    const res = await request(app).post('/api/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejects reuse of an already-rotated (revoked) refresh token', async () => {
    await request(app).post('/api/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    const { refreshToken } = loginRes.body.data;

    await request(app).post('/api/refresh').send({ refreshToken });
    const secondAttempt = await request(app).post('/api/refresh').send({ refreshToken });

    expect(secondAttempt.status).toBe(401);
    expect(secondAttempt.body.error.code).toBe('REFRESH_TOKEN_REVOKED');
  });
});

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
