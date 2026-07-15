const { ZodError } = require('zod');
const { BadRequestError } = require('../utils/AppError');

// Middleware to validate request data using a Zod schema
function validate(schema) {
  return (req, res, next) => {
    try {
      // Validate request body, params, and query
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Replace request data with validated values
      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;

      return next();
    } catch (err) {
      // Handle validation errors
      if (err instanceof ZodError) {
        // Format validation errors into a simple list
        const details = err.errors.map((e) => ({
          field: e.path.slice(1).join('.'),
          message: e.message,
        }));

        const validationError = new BadRequestError(
          'Validation failed',
          'VALIDATION_ERROR'
        );

        validationError.details = details;

        return next(validationError);
      }

      // Pass any other errors to the error handler
      return next(err);
    }
  };
}

module.exports = validate;