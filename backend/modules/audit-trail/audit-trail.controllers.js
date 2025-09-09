const asyncHandler = require('../../middleware/async');
const { getAuditTrailEntries } = require('./audit-trail.services');

// @desc    Get audit trail entries
// @route   GET /api/audit-trail
// @access  Private (Admin)
exports.getAuditTrail = asyncHandler(async (req, res, next) => {
  const { page, limit, search, entityType, action, startDate, endDate } = req.query;
  const filters = { page, limit, search, entityType, action, startDate, endDate };

  const result = await getAuditTrailEntries(filters);
  res.status(200).json({ success: true, ...result });
});