// Handles all errors in one place
// Every error response follows the same format
// eslint-disable-next-line no-unused-vars

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  // Log unexpected errors for debugging
  if (!isOperational) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  // Create a consistent error response
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',

      // Hide internal error details from the client
      message: isOperational
        ? err.message
        : 'Something went wrong. Please try again later.',
    },
  };

  // Include extra validation details if available
  if (err.details) {
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
}

// Handles requests to routes that do not exist
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };