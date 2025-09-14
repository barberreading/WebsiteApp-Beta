const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure Winston logger
const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'test' },
  transports: [
    // Write all errors to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'application-errors.log'),
      level: 'error',
      maxsize: 1048576, // 1MB (reduced from 5MB)
      maxFiles: 3,      // Keep only 3 rotated files
      tailable: true,   // Enable log rotation
      zippedArchive: true, // Compress rotated logs
    }),
    // Also log to the console in development
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })]
      : [])
  ]
});

// Create a model for storing errors in the database
const ErrorLog = require('../../models/ErrorLog');

/**
 * Log an error to file and database
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional metadata about the error
 * @param {String} metadata.userId - ID of the user who experienced the error (if available)
 * @param {String} metadata.userRole - Role of the user who experienced the error (if available)
 * @param {String} metadata.url - URL where the error occurred
 * @param {String} metadata.userAgent - User agent of the client
 * @param {String} metadata.componentStack - React component stack (for frontend errors)
 */
const logError = async (error, metadata = {}) => {
  try {
    // Log to file using Winston
    errorLogger.error({
      message: error.message,
      stack: error.stack,
      ...metadata,
      timestamp: new Date().toISOString()
    });

    // Log to database
    await ErrorLog.create({
      message: error.message,
      stack: error.stack,
      userId: metadata.userId || null,
      userRole: metadata.userRole || null,
      url: metadata.url || null,
      userAgent: metadata.userAgent || null,
      componentStack: metadata.componentStack || null,
      resolved: false,
      timestamp: new Date()
    });
  } catch (logError) {
    // If logging to the database fails, at least log to the console
    console.error('Error logging failed:', logError);
    console.error('Original error:', error);
  }
};

/**
 * Get all error logs with pagination
 * @param {Number} page - Page number (1-based)
 * @param {Number} limit - Number of items per page
 * @param {Object} filters - Filters to apply (e.g., { resolved: false })
 * @returns {Promise<Object>} - Paginated error logs
 */
const getErrorLogs = async (page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  
  const logs = await ErrorLog.find(filters)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await ErrorLog.countDocuments(filters);
  
  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Mark an error log as resolved
 * @param {String} logId - ID of the error log
 * @param {String} resolvedBy - ID of the user who resolved the error
 * @param {String} resolution - Description of how the error was resolved
 * @returns {Promise<Object>} - Updated error log
 */
const resolveErrorLog = async (logId, resolvedBy, resolution) => {
  return await ErrorLog.findByIdAndUpdate(
    logId,
    {
      resolved: true,
      resolvedBy,
      resolution,
      resolvedAt: new Date()
    },
    { new: true }
  );
};

module.exports = {
  logError,
  getErrorLogs,
  resolveErrorLog
};