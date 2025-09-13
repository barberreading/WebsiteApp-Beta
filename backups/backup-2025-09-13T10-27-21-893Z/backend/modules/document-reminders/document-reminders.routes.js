const express = require('express');
const router = express.Router();
const {
  checkReminders,
  resetFlags
} = require('./document-reminders.controllers');
const { protect, admin } = require('../../middleware/auth');

router.post('/check', protect, admin, checkReminders);
router.post('/reset-flags', protect, admin, resetFlags);

module.exports = router;