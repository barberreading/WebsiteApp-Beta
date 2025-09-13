const express = require('express');
const router = express.Router();
const { protect, role } = require('../../middleware/auth');
const { getEmailSettings, updateEmailSettings, testEmailSettings } = require('./email-settings.controllers');

// @route   GET /api/email-settings
// @desc    Get email settings
// @access  Private (manager, superuser)
router.get('/', protect, role(['manager', 'superuser']), getEmailSettings);

// @route   POST /api/email-settings
// @desc    Create or update email settings
// @access  Private (manager, superuser)
router.post('/', protect, role(['manager', 'superuser']), updateEmailSettings);

// @route   POST /api/email-settings/test
// @desc    Test email settings
// @access  Private (manager, superuser)
router.post('/test', protect, role(['manager', 'superuser']), testEmailSettings);

module.exports = router;