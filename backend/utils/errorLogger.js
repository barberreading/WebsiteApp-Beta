const ErrorLog = require('../models/ErrorLog');

/**
 * Log an error to the database
 * @param {Object} errorData - Error data to log
 * @returns {Promise<Object>} - The saved error log
 */
const logError = async (errorData) => {
  try {
    const errorLog = new ErrorLog(errorData);
    return await errorLog.save();
  } catch (error) {
    console.error('Failed to log error:', error);
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
    console.error('Failed to get error logs:', error);
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
    console.error('Failed to resolve error log:', error);
    throw error;
  }
};

module.exports = {
  logError,
  getErrorLogs,
  resolveErrorLog
};