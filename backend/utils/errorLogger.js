const ErrorLog = require('../models/ErrorLog');

/**
 * Log an error to the database
 * @param {String|Object} typeOrErrorData - Error type string or complete error data object
 * @param {String} message - Error message (optional if first param is object)
 * @param {Object} metadata - Additional error metadata (optional if first param is object)
 * @returns {Promise<Object>} - The saved error log
 */
const logError = async (typeOrErrorData, message, metadata = {}) => {
  try {
    let errorData;
    
    // Handle both old format (object) and new format (type, message, metadata)
    if (typeof typeOrErrorData === 'object' && typeOrErrorData !== null) {
      // Old format: single object parameter
      errorData = typeOrErrorData;
    } else {
      // New format: separate parameters
      errorData = {
        type: typeOrErrorData,
        message: message,
        ...metadata,
        timestamp: new Date()
      };
    }
    
    const errorLog = new ErrorLog(errorData);
    return await errorLog.save();
  } catch (error) {
    logger.error('Failed to log error:', error);
    throw error;
  }
};

/**
 * Get error logs with optional filtering
 * @param {Object} filters - Filters to apply
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} - Array of error logs
 */
const getErrorLogs = async (filters = {}, options = {}) => {
  try {
    const {
      limit = 50,
      skip = 0,
      sort = { timestamp: -1 }
    } = options;

    return await ErrorLog.find(filters)
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name email')
      .sort(sort)
      .limit(limit)
      .skip(skip);
  } catch (error) {
    logger.error('Failed to get error logs:', error);
    throw error;
  }
};

/**
 * Resolve an error log
 * @param {String} errorId - ID of the error log to resolve
 * @param {String} resolvedById - ID of the user resolving the error
 * @param {String} resolution - Resolution description
 * @returns {Promise<Object>} - The updated error log
 */
const resolveErrorLog = async (errorId, resolvedById, resolution) => {
  try {
    return await ErrorLog.findByIdAndUpdate(
      errorId,
      {
        resolved: true,
        resolvedBy: resolvedById,
        resolution: resolution,
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('resolvedBy', 'name email');
  } catch (error) {
    logger.error('Failed to resolve error log:', error);
    throw error;
  }
};

module.exports = {
  logError,
  getErrorLogs,
  resolveErrorLog
};