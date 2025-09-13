const asyncHandler = require('../../middleware/async');
const {
  runMissingTimesheetReminders,
  runClientApprovalReminders,
  runApprovalNotifications
} = require('./cron-jobs.services');

const triggerMissingTimesheetReminders = asyncHandler(async (req, res) => {
  const results = await runMissingTimesheetReminders();
  res.status(200).json({ 
    message: `Missing timesheet reminders process completed. Success: ${results.success}, Failed: ${results.failed}` 
  });
});

const triggerClientApprovalReminders = asyncHandler(async (req, res) => {
  const results = await runClientApprovalReminders();
  res.status(200).json({ 
    message: `Client approval reminders process completed. Success: ${results.success}, Failed: ${results.failed}` 
  });
});

const triggerApprovalNotifications = asyncHandler(async (req, res) => {
  const results = await runApprovalNotifications();
  res.status(200).json({ 
    message: `Approval notifications process completed. Success: ${results.success}, Failed: ${results.failed}` 
  });
});

module.exports = {
  triggerMissingTimesheetReminders,
  triggerClientApprovalReminders,
  triggerApprovalNotifications
};