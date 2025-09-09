const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('./email.controllers');
const { protect, admin } = require('../../middleware/auth');

/**
 * @description Route for sending a test email
 * @route POST /api/email/test
 * @access Private (admin)
 */
router.post('/test', protect, admin, sendTestEmail);

module.exports = router;