const asyncHandler = require('../../middleware/async');
const {
  getErrorLogs: getErrorLogsService,
  resolveErrorLog: resolveErrorLogService
} = require('./error-logging.services');

/**
 * @desc    Get all error logs
 * @route   GET /api/error-logging
 * @access  Private (Admin)
 */
const getErrorLogs = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, resolved } = req.query;
  const filters = {};
  if (resolved) {
    filters.resolved = resolved === 'true';
  }

  const data = await getErrorLogsService(parseInt(page), parseInt(limit), filters);

  res.status(200).json({
    success: true,
    data
  });
});

/**
 * @desc    Resolve an error log
 * @route   PUT /api/error-logging/:id/resolve
 * @access  Private (Admin)
 */
const resolveErrorLog = asyncHandler(async (req, res, next) => {
  const { resolution } = req.body;
  const resolvedBy = req.user.id;

  const log = await resolveErrorLogService(req.params.id, resolvedBy, resolution);

  if (!log) {
    return next(new ErrorResponse(`Error log not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

module.exports = {
  getErrorLogs,
  resolveErrorLog
};