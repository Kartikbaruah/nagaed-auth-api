const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const tokenRepository = require('../repositories/tokenRepository');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiryToDate,
  REFRESH_EXPIRES_IN,
} = require('../utils/token');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../utils/AppError');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Register a new user
async function register({ username, email, password, address }) {
  // Check if the email or username already exists
  const [existingByEmail, existingByUsername] = await Promise.all([
    userRepository.findByEmail(email),
    userRepository.findByUsername(username),
  ]);

  if (existingByEmail) {
    throw new ConflictError('Email already in use', 'EMAIL_IN_USE');
  }

  if (existingByUsername) {
    throw new ConflictError('Username already taken', 'USERNAME_TAKEN');
  }

  // Hash the password before saving
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create the user
  const user = await userRepository.create({
    username,
    email,
    passwordHash,
    address,
  });

  return sanitizeUser(user);
}

// Login a user
async function login({ email, password }) {
  // Find the user by email
  const user = await userRepository.findByEmail(email);

  // Return the same message for all login failures
  if (!user) {
    throw new UnauthorizedError(
      'Invalid email or password',
      'INVALID_CREDENTIALS'
    );
  }

  // Compare the entered password with the stored hash
  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new UnauthorizedError(
      'Invalid email or password',
      'INVALID_CREDENTIALS'
    );
  }

  // Generate access and refresh tokens
  const tokens = await issueTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// Refresh the access token using a valid refresh token
async function refresh({ refreshToken }) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError(
      'Invalid or expired refresh token',
      'INVALID_REFRESH_TOKEN'
    );
  }

  // Check if the refresh token exists in the database
  const tokenHash = hashToken(refreshToken);
  const stored = await tokenRepository.findValidToken(tokenHash);

  if (!stored) {
    throw new UnauthorizedError(
      'Refresh token has been revoked or expired',
      'REFRESH_TOKEN_REVOKED'
    );
  }

  // Get the user linked to the token
  const user = await userRepository.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedError(
      'User no longer exists',
      'USER_NOT_FOUND'
    );
  }

  // Revoke the old refresh token
  await tokenRepository.revokeToken(tokenHash);

  // Issue a new token pair
  const tokens = await issueTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// Get a user's profile
async function getProfile(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  return sanitizeUser(user);
}

// Generate and store a new access and refresh token
async function issueTokenPair(user) {
  const claims = {
    sub: user.id,
    email: user.email,
  };

  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);

  // Save the refresh token in the database
  await tokenRepository.storeRefreshToken({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: expiryToDate(REFRESH_EXPIRES_IN),
  });

  return {
    accessToken,
    refreshToken,
  };
}

// Remove the password before sending user data
function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = {
  register,
  login,
  refresh,
  getProfile,
};