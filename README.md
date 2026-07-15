# NagaEd Auth API + Access Terminal

**Kartik Baruah**
Phone: 9101316056
Email: kbkartikbaruah1@gmail.com

Submission for the NagaEd Software Developer hurdle task — covers Task 1 (Node.js
backend API) and Task 2 (React frontend), built as one project since the frontend
is just a client of the backend.

The backend is a fairly standard JWT auth API — register, login, get profile,
refresh tokens — but I tried to build it the way I'd actually build it for a real
project. The frontend is where I had some fun: instead
of a plain login form, it's a vault door. There's a spinning wheel and locking bolts
in the center, and when you log in successfully the whole thing swings open on a
hinge to show a dashboard behind it. Get the password wrong and the wheel jolts and
the rim lights flash red instead. Probably more animation than a hurdle task strictly
needs, but I wanted to build something I'd actually enjoy showing someone.

## Some of the decisions behind it

**Prisma instead of raw SQL.** I usually work with Prisma + MongoDB, so this was a
chance to use it against MySQL instead. Type-safe queries, migrations that are
actually readable, and no hand-built SQL strings around user input.

**Refresh tokens that actually rotate.** Access tokens are short-lived (15 min).
Refresh tokens live longer, but they're stored server-side as a SHA-256 hash, and every time one is used it gets revoked and replaced with a new one. So if
someone got hold of an old refresh token, it's already dead. I actually caught a real
bug while writing tests for this — two tokens signed in the same second came out
byte-identical because JWT's `iat` is only second-precision, so "rotation" wasn't
really rotating anything. Fixed it by adding a random `jti` to every token.

**Validation with Zod, not scattered `if` checks.** One schema per endpoint, so the
validation rules for an endpoint live in exactly one place.

**Every error response looks the same.** `{ success: false, error: { code, message } }`
every time, whether it's a bad password, an expired token, or a route that doesn't
exist. Nothing about the shape changes across endpoints.

**Layers stay in their lane.** Routes call controllers, controllers call services,
services call repositories, and only the repositories touch Prisma directly. Nobody
reaches past their layer to grab something they shouldn't.

**Rate limiting on login and register.** Small thing, easy to skip, but it's real
brute-force protection.

**Tests that actually run.** 14 integration tests with Jest + Supertest, against an
in-memory fake of Prisma, so `npm test` doesn't need a real database to pass.

## Stack

Node.js, Express, Prisma (MySQL), bcrypt, JWT, Zod, Jest, Supertest on the backend.
React (Vite), React Router on the frontend.

## Layout

```
src/                      Node/Express API
  app.js                  express app + middleware wiring
  server.js               entry point, graceful shutdown
  config/db.js            prisma client
  routes/                 route definitions
  controllers/            thin — just parses requests and calls services
  services/                the actual business logic
  repositories/            the only place prisma gets called
  middlewares/             auth check, validation, rate limits, error handler
  validators/              zod schemas
  utils/                   error classes, jwt helpers
prisma/schema.prisma      User + RefreshToken models
tests/                    the jest/supertest suite, plus a mock prisma client

client/                   the React frontend
  src/
    api/authApi.js         all the fetch calls live here, nowhere else
    hooks/useAuth.jsx       session state, talks to localStorage
    components/
      BlastDoor.jsx         the vault door itself
      TerminalField.jsx     reusable input field
      ProtectedRoute.jsx    keeps /dashboard behind a login
    pages/
      LoginPage.jsx
      RegisterPage.jsx
      Dashboard.jsx         what's behind the door once it opens

architecture-diagram.png
```

## Running it

You'll need Node 18+ and a MySQL instance somewhere — local, Docker, or a free tier
like PlanetScale or Railway all work fine.

**Backend:**

```bash
npm install
cp .env.example .env
```

Then open `.env` and fill in:
- `DATABASE_URL` — wherever your MySQL is
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — any long random string works,
  `openssl rand -hex 32` is an easy way to generate one

```bash
npx prisma migrate dev --name init
npm run dev
```

That last command starts the API on `http://localhost:5000`.

**Tests:**

```bash
npm test
```

No database needed for this — it runs against a mock.

There's also a second suite that hits your real MySQL database directly,
no mocking at all — same register/login/refresh flow, but it actually
writes a row, reads it back, and cleans up after itself:

```bash
npm run test:live
```

This needs your `.env` set up and migrated first (same as running the
server). It's separate from `npm test` on purpose — one is a fast sanity
check you'd run on every save, the other is a slower, real end-to-end
check you'd run before a release (or to prove to someone the whole stack
actually works, not just the logic in isolation).

**Frontend:**

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Then go to `http://localhost:5173`. Register an account first (there's nothing
seeded), then log in and watch the door.

## API

Every response comes back as either:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "...", "details": [ ... ] } }
```

**Register**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kartik_dev",
    "email": "kartik@example.com",
    "password": "StrongPass1",
    "address": "123 Main Street, Guwahati, Assam"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "kartik@example.com", "password": "StrongPass1" }'
```
Gives back `{ user, accessToken, refreshToken }`.

**Get profile (needs a token)**
```bash
curl http://localhost:5000/api/users/<user-id> \
  -H "Authorization: Bearer <accessToken>"
```

**Refresh**
```bash
curl -X POST http://localhost:5000/api/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<refreshToken>" }'
```
Gives you a new token pair and kills the old refresh token immediately.

**Health check**
```bash
curl http://localhost:5000/health
```

## Password rules

Passwords need at least 8 characters, one uppercase letter, and one number.
Usernames are 3-30 characters, letters/numbers/underscores only.

If a login fails, the error is the same generic "invalid email or password"
whether the email doesn't exist or the password's just wrong — otherwise
you'd be handing attackers a way to check which emails are registered.

## Security, checked off

- Passwords hashed with bcrypt (cost factor 12) — never stored or logged in plain text
- JWT secrets come from environment variables, never hardcoded
- Refresh tokens are stored as hashes and rotated on every use
- Rate limiting on login and register
- `helmet` for the standard security headers
- Request body size capped at 10kb
- Generic error messages so failed logins don't leak which emails exist
- `.env` is gitignored, `.env.example` is there as a template instead

## What's not here

- No email verification — wasn't in scope for this
- No password reset flow — same
- Refresh tokens don't get cleaned out of the DB once they expire — in a real
  production setup I'd add a scheduled job for that, just didn't build it for
  a hurdle task