const asyncHandler = require('../../middleware/async');
const {
  checkAllLogs,
  clearAllLogs,
  truncateLogIfNeeded,
  clearLog
} = require('./logging.services');

// @desc    Check and manage all log files
// @route   POST /api/logging/check
// @access  Private (admin)
const checkLogs = asyncHandler(async (req, res, next) => {
  checkAllLogs();
  res.status(200).json({ success: true, message: 'Log files checked and managed successfully' });
});

// @desc    Clear all log files
// @route   POST /api/logging/clear
// @access  Private (admin)
const clearLogs = asyncHandler(async (req, res, next) => {
  clearAllLogs();
  res.status(200).json({ success: true, message: 'All log files cleared successfully' });
});

// @desc    Truncate a specific log file if needed
// @route   POST /api/logging/truncate/:logPath
// @access  Private (admin)
const truncateLog = asyncHandler(async (req, res, next) => {
  const { logPath } = req.params;
  const result = truncateLogIfNeeded(logPath);
  if (result) {
    res.status(200).json({ success: true, message: 'Log file truncated successfully' });
  } else {
    res.status(200).json({ success: true, message: 'Log file does not need truncation' });
  }
});

// @desc    Clear a specific log file
// @route   POST /api/logging/clear/:logPath
// @access  Private (admin)
const clearSpecificLog = asyncHandler(async (req, res, next) => {
  const { logPath } = req.params;
  const result = clearLog(logPath);
  if (result) {
    res.status(200).json({ success: true, message: 'Log file cleared successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Log file not found' });
  }
});

module.exports = {
  checkLogs,
  clearLogs,
  truncateLog,
  clearSpecificLog
};