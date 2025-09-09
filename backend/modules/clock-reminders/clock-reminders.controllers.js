const asyncHandler = require('../../middleware/async');
const { sendClockInReminders, sendClockOutReminders } = require('./clock-reminders.services');

const triggerClockInReminders = asyncHandler(async (req, res) => {
  const result = await sendClockInReminders();
  res.status(200).json({ success: true, message: result.message });
});

const triggerClockOutReminders = asyncHandler(async (req, res) => {
  const result = await sendClockOutReminders();
  res.status(200).json({ success: true, message: result.message });
});

module.exports = {
  triggerClockInReminders,
  triggerClockOutReminders
};