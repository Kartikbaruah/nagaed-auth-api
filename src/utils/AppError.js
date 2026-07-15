// Base error class used throughout the application
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.statusCode = statusCode;

    // Use the provided error code or a default one
    this.code = code || defaultCodeFor(statusCode);

    // Marks this as a handled application error
    this.isOperational = true;

    // Capture the stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// Return a default error code based on the status code
function defaultCodeFor(statusCode) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
  };

  return map[statusCode] || 'ERROR';
}

// Error for invalid requests
class BadRequestError extends AppError {
  constructor(message = 'Bad request', code) {
    super(message, 400, code);
  }
}

// Error for unauthorized access
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code) {
    super(message, 401, code);
  }
}

// Error when a resource already exists
class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code) {
    super(message, 409, code);
  }
}

// Error when a resource cannot be found
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code) {
    super(message, 404, code);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
};