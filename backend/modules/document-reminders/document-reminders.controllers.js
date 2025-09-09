const asyncHandler = require('../../middleware/async');
const {
  checkDocumentReminders,
  resetReminderFlags
} = require('./document-reminders.services');

// @desc    Check for document reminders and send emails
// @route   POST /api/document-reminders/check
// @access  Private (admin)
const checkReminders = asyncHandler(async (req, res, next) => {
  const result = await checkDocumentReminders();
  res.status(200).json({ success: true, message: `${result.count} reminder(s) sent.` });
});

// @desc    Reset reminder flags for documents
// @route   POST /api/document-reminders/reset-flags
// @access  Private (admin)
const resetFlags = asyncHandler(async (req, res, next) => {
  const result = await resetReminderFlags();
  res.status(200).json({ success: true, message: `Reset flags for ${result.count} document(s).` });
});

module.exports = {
  checkReminders,
  resetFlags
};