const asyncHandler = require('../../middleware/async');
const emailSettingsService = require('./email-settings.services');

exports.getEmailSettings = asyncHandler(async (req, res) => {
    const settings = await emailSettingsService.getEmailSettings();
    res.json({ success: true, data: settings });
});

exports.updateEmailSettings = asyncHandler(async (req, res) => {
    const settings = await emailSettingsService.updateEmailSettings(req.body, req.user.id);
    res.json({ success: true, data: settings, message: 'Email settings saved successfully' });
});

exports.testEmailSettings = asyncHandler(async (req, res) => {
    const result = await emailSettingsService.testEmailSettings(req.body.testEmail);
    res.json({ success: true, message: 'Test email sent successfully', data: result });
});