const asyncHandler = require('../../middleware/async');
const {
  generateOutlookCalendarLink,
  generateICalContent
} = require('./calendar-integration.services');

// @desc    Generate Outlook calendar link
// @route   POST /api/calendar-integration/outlook
// @access  Public
const getOutlookCalendarLink = asyncHandler(async (req, res, next) => {
  const { booking } = req.body;
  if (!booking) {
    return res.status(400).json({ success: false, message: 'Booking data is required' });
  }
  const link = generateOutlookCalendarLink(booking);
  res.status(200).json({ success: true, link });
});

// @desc    Generate iCal calendar file
// @route   POST /api/calendar-integration/ical
// @access  Public
const getICalFile = asyncHandler(async (req, res, next) => {
  const { booking } = req.body;
  if (!booking) {
    return res.status(400).json({ success: false, message: 'Booking data is required' });
  }
  const content = generateICalContent(booking);
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', 'attachment; filename=booking.ics');
  res.status(200).send(content);
});

module.exports = {
  getOutlookCalendarLink,
  getICalFile
};