const authService = require('../services/authService');
const { UnauthorizedError } = require('../utils/AppError');

// Register a new user
async function register(req, res, next) {
  try {
    // Pass user data to the service layer
    const user = await authService.register(req.body);

    // Return the created user with 201 status
    return res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    // Pass any error to the global error handler
    return next(err);
  }
}

// Login an existing user
async function login(req, res, next) {
  try {
    // Verify credentials and generate tokens
    const result = await authService.login(req.body);

    // Send login response
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

// Generate a new access token using the refresh token
async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);

    // Return the new access token
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

// Get the logged-in user's profile
async function getUser(req, res, next) {
  try {
    // Prevent users from accessing someone else's profile
    if (req.params.id !== req.user.id) {
      throw new UnauthorizedError(
        'You may only access your own profile',
        'FORBIDDEN_RESOURCE'
      );
    }

    // Fetch user details from the service
    const user = await authService.getProfile(req.params.id);

    // Return user profile
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, getUser };