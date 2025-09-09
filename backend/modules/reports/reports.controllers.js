const asyncHandler = require('../../middleware/async');
const { generateReport } = require('./reports.services');

// @desc    Get report
// @route   GET /api/reports/:reportType
// @access  Private (manager, superuser)
exports.getReport = asyncHandler(async (req, res, next) => {
  const { reportType } = req.params;
  const { startDate, endDate, includeNoClientBookings } = req.query;

  const reportData = await generateReport(
    reportType,
    startDate,
    endDate,
    includeNoClientBookings === 'true'
  );

  res.status(200).json({ success: true, data: reportData });
});