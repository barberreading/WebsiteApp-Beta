const asyncHandler = require('../../middleware/async');
const availableStaffService = require('./available-staff.services');

// @desc    Get available staff for a given time range
// @route   GET /api/available-staff
// @access  Private (Managers, Superusers, and Admins)
exports.getAvailableStaff = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.query;

  if (!startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both a start and end time'
    });
  }

  const availableStaff = await availableStaffService.getAvailableStaff(startTime, endTime);

  res.status(200).json({
    success: true,
    count: availableStaff.length,
    data: availableStaff
  });
});