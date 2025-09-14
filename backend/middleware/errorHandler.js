const ErrorResponse = require('../utils/errorResponse');
const ErrorLog = require('../models/ErrorLog');

/**
 * Global error handling middleware
 * Handles all errors and provides consistent error responses
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (exclude sensitive information)
  const errorLog = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date(),
    userId: req.user ? req.user.id : null
  };

  // Save error to database (async, don't wait)
  try {
    await ErrorLog.create(errorLog);
  } catch (logError) {
    logger.error('Failed to log error to database:', logError.message);
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new ErrorResponse(message, 429);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Don't expose sensitive information in production
  const response = {
    success: false,
    error: message
  };

  // Add stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};