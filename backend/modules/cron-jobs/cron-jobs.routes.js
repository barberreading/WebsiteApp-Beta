const express = require('express');
const router = express.Router();
const {
  triggerMissingTimesheetReminders,
  triggerClientApprovalReminders,
  triggerApprovalNotifications
} = require('./cron-jobs.controllers');
const { protect, authorize } = require('../../middleware/auth');

router.post('/run/missing-timesheet-reminders', protect, authorize('admin'), triggerMissingTimesheetReminders);
router.post('/run/client-approval-reminders', protect, authorize('admin'), triggerClientApprovalReminders);
router.post('/run/approval-notifications', protect, authorize('admin'), triggerApprovalNotifications);

module.exports = router;