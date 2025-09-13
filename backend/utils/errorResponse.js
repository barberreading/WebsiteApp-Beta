/**
 * Custom Error Response Class
 * Used to create standardized error responses throughout the application
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ErrorResponse';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a standardized error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Additional error data (optional)
 * @returns {Object} Standardized error response
 */
const createErrorResponse = (message, statusCode = 500, data = null) => {
  const error = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (data) {
    error.error.data = data;
  }

  return error;
};

/**
 * Create a validation error response
 * @param {Array|Object} errors - Validation errors
 * @returns {Object} Validation error response
 */
const createValidationError = (errors) => {
  return createErrorResponse('Validation failed', 400, { errors });
};

/**
 * Create a not found error response
 * @param {string} resource - Resource that was not found
 * @returns {Object} Not found error response
 */
const createNotFoundError = (resource = 'Resource') => {
  return createErrorResponse(`${resource} not found`, 404);
};

/**
 * Create an unauthorized error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Unauthorized error response
 */
const createUnauthorizedError = (message = 'Unauthorized access') => {
  return createErrorResponse(message, 401);
};

/**
 * Create a forbidden error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Forbidden error response
 */
const createForbiddenError = (message = 'Access forbidden') => {
  return createErrorResponse(message, 403);
};

/**
 * Create a server error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Server error response
 */
const createServerError = (message = 'Internal server error') => {
  return createErrorResponse(message, 500);
};

/**
 * Create a bad request error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Bad request error response
 */
const createBadRequestError = (message = 'Bad request') => {
  return createErrorResponse(message, 400);
};

module.exports = ErrorResponse;
module.exports.ErrorResponse = ErrorResponse;
module.exports.createErrorResponse = createErrorResponse;
module.exports.createValidationError = createValidationError;
module.exports.createNotFoundError = createNotFoundError;
module.exports.createUnauthorizedError = createUnauthorizedError;
module.exports.createForbiddenError = createForbiddenError;
module.exports.createServerError = createServerError;
module.exports.createBadRequestError = createBadRequestError;