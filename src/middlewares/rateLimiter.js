const rateLimit = require('express-rate-limit');

// Limit login requests to help prevent brute-force attacks
const loginLimiter = rateLimit({
  // Time window: 15 minutes
  windowMs: 15 * 60 * 1000,

  // Maximum 10 login attempts per IP
  max: 10,

  standardHeaders: true,
  legacyHeaders: false,

  // Response when the limit is exceeded
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
});

// Limit registration requests to reduce spam accounts
const registerLimiter = rateLimit({
  // Time window: 1 hour
  windowMs: 60 * 60 * 1000,

  // Maximum 20 registration attempts per IP
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  // Response when the limit is exceeded
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many registration attempts. Please try again later.',
    },
  },
});

module.exports = { loginLimiter, registerLimiter };