const { verifyAccessToken } = require('../utils/token');
const { UnauthorizedError } = require('../utils/AppError');

// Middleware to verify the user's access token
function authenticate(req, res, next) {
  // Get the Authorization header
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  // Check if the token is present in the correct format
  if (scheme !== 'Bearer' || !token) {
    return next(
      new UnauthorizedError(
        'Missing or malformed Authorization header',
        'MISSING_TOKEN'
      )
    );
  }

  try {
    // Verify the access token
    const payload = verifyAccessToken(token);

    // Store user information for the next middleware or route
    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    return next();
  } catch (err) {
    // Handle expired token
    if (err.name === 'TokenExpiredError') {
      return next(
        new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED')
      );
    }

    // Handle invalid token
    return next(
      new UnauthorizedError('Invalid access token', 'INVALID_TOKEN')
    );
  }
}

module.exports = authenticate;