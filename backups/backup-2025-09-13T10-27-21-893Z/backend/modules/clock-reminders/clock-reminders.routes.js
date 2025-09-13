const express = require('express');
const router = express.Router();
const { triggerClockInReminders, triggerClockOutReminders } = require('./clock-reminders.controllers');
const { protect, authorize } = require('../../middleware/auth');

router.post('/reminders/clock-in', protect, authorize('admin'), triggerClockInReminders);
router.post('/reminders/clock-out', protect, authorize('admin'), triggerClockOutReminders);

module.exports = router;