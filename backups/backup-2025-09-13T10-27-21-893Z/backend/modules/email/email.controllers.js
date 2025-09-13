const asyncHandler = require('../../middleware/async');
const emailService = require('./email.services');
const EmailSettings = require('../../models/EmailSettings');

/**
 * @description Send a test email
 * @route   POST /api/email/test
 * @access  Private (admin)
 */
const sendTestEmail = asyncHandler(async (req, res) => {
  const { testEmail } = req.body;
  const settings = await EmailSettings.findOne();

  if (!settings || !settings.enabled) {
    return res.status(400).json({ message: 'Email sending is not enabled or configured.' });
  }

  await emailService.sendTestEmail(settings, testEmail);
  res.status(200).json({ message: `Test email sent successfully to ${testEmail}` });
});

module.exports = {
  sendTestEmail,
};