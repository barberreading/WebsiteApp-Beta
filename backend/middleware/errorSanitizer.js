/**
 * Error sanitization middleware for production environment
 * Prevents sensitive information from being exposed in error responses
 */

const logger = require('../utils/logger');

// Sensitive keys that should be redacted from error messages
const SENSITIVE_KEYS = [
  'password', 'token', 'auth', 'secret', 'key', 'credential',
  'authorization', 'cookie', 'session', 'jwt', 'bearer',
  'connectionstring', 'database', 'db', 'mongo', 'sql'
];

// Error types that should be sanitized
const SANITIZE_ERROR_TYPES = [
  'ValidationError',
  'CastError',
  'MongoError',
  'MongooseError',
  'JsonWebTokenError',
  'TokenExpiredError'
];

class ErrorSanitizer {
  static sanitizeError(error) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In development, return full error details
    if (!isProduction) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error.errors && { errors: error.errors })
      };
    }

    // In production, sanitize error details
    const sanitizedError = {
      message: this.sanitizeMessage(error.message),
      name: error.name || 'Error'
    };

    // Add specific handling for different error types
    switch (error.name) {
      case 'ValidationError':
        sanitizedError.message = 'Validation failed';
        sanitizedError.type = 'validation';
        break;
      
      case 'CastError':
        sanitizedError.message = 'Invalid data format';
        sanitizedError.type = 'format';
        break;
      
      case 'MongoError':
      case 'MongooseError':
        sanitizedError.message = 'Database operation failed';
        sanitizedError.type = 'database';
        break;
      
      case 'JsonWebTokenError':
      case 'TokenExpiredError':
        sanitizedError.message = 'Authentication failed';
        sanitizedError.type = 'authentication';
        break;
      
      case 'MulterError':
        sanitizedError.message = 'File upload failed';
        sanitizedError.type = 'upload';
        break;
      
      default:
        sanitizedError.message = 'An error occurred';
        sanitizedError.type = 'general';
    }

    return sanitizedError;
  }

  static sanitizeMessage(message) {
    if (!message || typeof message !== 'string') {
      return 'An error occurred';
    }

    let sanitizedMessage = message;

    // Remove sensitive information from error messages
    SENSITIVE_KEYS.forEach(key => {
      const regex = new RegExp(`${key}[\s]*[:=][\s]*[^\s,}]+`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, `${key}: [REDACTED]`);
    });

    // Remove file paths that might contain sensitive information
    sanitizedMessage = sanitizedMessage.replace(/[A-Za-z]:\\[^\s]+/g, '[PATH_REDACTED]');
    sanitizedMessage = sanitizedMessage.replace(/\/[^\s]+\//g, '[PATH_REDACTED]/');

    // Remove IP addresses
    sanitizedMessage = sanitizedMessage.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_REDACTED]');

    // Remove email addresses
    sanitizedMessage = sanitizedMessage.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

    // Remove URLs
    sanitizedMessage = sanitizedMessage.replace(/https?:\/\/[^\s]+/g, '[URL_REDACTED]');

    return sanitizedMessage;
  }

  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sensitive => 
        lowerKey.includes(sensitive)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    });

    return sanitized;
  }

  static logError(error, req = null) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    if (req) {
      errorInfo.request = {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      };
    }

    // Log full error details securely
    logger.error('Application error:', this.sanitizeObject(errorInfo));
  }
}

// Express error handling middleware
const errorSanitizerMiddleware = (err, req, res, next) => {
  // Log the full error for debugging
  ErrorSanitizer.logError(err, req);

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'CastError') statusCode = 400;
  if (err.name === 'JsonWebTokenError') statusCode = 401;
  if (err.name === 'TokenExpiredError') statusCode = 401;
  if (err.code === 11000) statusCode = 409; // MongoDB duplicate key

  // Sanitize error for client response
  const sanitizedError = ErrorSanitizer.sanitizeError(err);

  res.status(statusCode).json({
    success: false,
    error: sanitizedError,
    ...(process.env.NODE_ENV === 'development' && { 
      originalError: err.message,
      stack: err.stack 
    })
  });
};

module.exports = {
  ErrorSanitizer,
  errorSanitizerMiddleware
};