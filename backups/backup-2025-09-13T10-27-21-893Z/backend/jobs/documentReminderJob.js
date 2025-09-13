const cron = require('node-cron');
const { checkDocumentReminders, resetReminderFlags } = require('../utils/documentReminders');

// Schedule document reminder check to run daily at 1:00 AM
const scheduleDocumentReminderJob = () => {
  console.log('Scheduling document reminder job...');
  
  // Run document reminder check daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running document reminder check...');
    await checkDocumentReminders();
  });
  
  // Reset reminder flags weekly on Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('Resetting document reminder flags...');
    await resetReminderFlags();
  });
  
  console.log('Document reminder job scheduled successfully');
};

module.exports = scheduleDocumentReminderJob;