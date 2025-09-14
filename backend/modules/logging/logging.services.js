/**
 * Log Manager - Handles automatic log rotation and cleanup
 * 
 * This utility ensures logs don't grow too large by:
 * 1. Automatically truncating logs that exceed size limits
 * 2. Rotating logs on a schedule
 * 3. Providing methods to manually clear logs when needed
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOG_CONFIG = {
  maxLogSize: 1048576, // 1MB
  logPaths: [
    path.join(__dirname, '../../logs/application-errors.log'),
    path.join(__dirname, '../../error.log'),
    path.join(__dirname, '../../combined.log')
  ]
};

/**
 * Truncates a log file if it exceeds the maximum size
 * @param {string} logPath - Path to the log file
 */
const truncateLogIfNeeded = (logPath) => {
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size > LOG_CONFIG.maxLogSize) {
        fs.truncateSync(logPath, 0);
        logger.log(`Truncated log file: ${logPath}`);
      }
    }
  } catch (error) {
    logger.error(`Error truncating log file ${logPath}:`, error);
  }
};

/**
 * Clears a log file completely
 * @param {string} logPath - Path to the log file
 * @returns {boolean} - True if log was cleared
 */
const clearLog = (logPath) => {
  try {
    if (fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
      logger.log(`Cleared log file: ${logPath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error clearing log file ${logPath}:`, error);
    return false;
  }
};

/**
 * Checks and manages all configured log files
 */
const checkAllLogs = () => {
  for (const logPath of LOG_CONFIG.logPaths) {
    truncateLogIfNeeded(logPath);
  }
};

/**
 * Clears all configured log files
 */
const clearAllLogs = () => {
  for (const logPath of LOG_CONFIG.logPaths) {
    clearLog(logPath);
  }
};

// Export functions
module.exports = {
  truncateLogIfNeeded,
  clearLog,
  checkAllLogs,
  clearAllLogs
};