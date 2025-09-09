const cron = require('node-cron');
const { checkDocumentReminders } = require('../document-reminders/document-reminders.services');
const {
  sendMissingTimesheetReminders,
  sendClientApprovalReminders,
  sendApprovalNotifications
} = require('../../utils/timesheetReminders.js');
const { sendClockInReminders, sendClockOutReminders } = require('../clock-reminders/clock-reminders.services');
const User = require('../../models/User');
const logger = require('../logging/logging.services');

/**
 * Initialize all scheduled tasks
 */
const initScheduler = () => {
  // Schedule document reminder job to run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running scheduled document reminder job');
    try {
      await checkDocumentReminders();
      logger.info('Document reminder job completed successfully');
    } catch (error) {
      logger.error(`Error running document reminder job: ${error.message}`);
    }
  });

  // Schedule missing timesheet reminders - Monday at 10:00 AM
  cron.schedule('0 10 * * 1', async () => {
    logger.info('Running scheduled missing timesheet reminder job');
    try {
      const results = await runMissingTimesheetReminders();
      logger.info(`Missing timesheet reminders sent: ${results.success}, failed: ${results.failed}`);
    } catch (error) {
      logger.error('Error in missing timesheet reminder task:', error);
    }
  });

  // Schedule client approval reminders - Monday at 11:00 AM
  cron.schedule('0 11 * * 1', async () => {
    logger.info('Running scheduled client approval reminder job');
    try {
      const results = await runClientApprovalReminders();
      logger.info(`Client approval reminders sent: ${results.success}, failed: ${results.failed}`);
    } catch (error) {
      logger.error('Error in client approval reminder task:', error);
    }
  });

  // Schedule clock-in reminders - Every 15 minutes during working hours
  cron.schedule('*/15 7-19 * * 1-5', async () => {
    logger.info('Running scheduled clock-in reminder job');
    try {
      const results = await sendClockInReminders();
      logger.info(`Clock-in reminders sent: ${results.remindersSent}`);
    } catch (error) {
      logger.error('Error in clock-in reminder task:', error);
    }
  });

  // Schedule clock-out reminders - Every 15 minutes during working hours
  cron.schedule('*/15 7-19 * * 1-5', async () => {
    logger.info('Running scheduled clock-out reminder job');
    try {
      const results = await sendClockOutReminders();
      logger.info(`Clock-out reminders sent: ${results.remindersSent}`);
    } catch (error) {
      logger.error('Error in clock-out reminder task:', error);
    }
  });

  // Schedule daily check for newly approved timesheets - Every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running scheduled approval notification job');
    try {
      const results = await runApprovalNotifications();
      logger.info(`Approval notifications sent: ${results.success}, failed: ${results.failed}`);
    } catch (error) {
      logger.error('Error in approval notification task:', error);
    }
  });

  logger.info('Scheduler initialized with timesheet reminders');
};

/**
 * Run the missing timesheet reminders process
 * @returns {Promise<Object>} Results of the operation
 */
const runMissingTimesheetReminders = async () => {
  const results = { success: 0, failed: 0 };
  
  try {
    // Get all active staff members
    const staffMembers = await User.find({ 
      role: 'staff', 
      active: true 
    });
    
    for (const staff of staffMembers) {
      // Find missing timesheets for this staff member
      const missingDates = await findMissingTimesheets(staff._id);
      
      if (missingDates.length > 0) {
        // Send reminder email
        const success = await sendMissingTimesheetReminders(staff, missingDates);
        
        if (success) {
          results.success++;
        } else {
          results.failed++;
        }
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error in runMissingTimesheetReminders:', error);
    throw error;
  }
};

/**
 * Run the client approval reminders process
 * @returns {Promise<Object>} Results of the operation
 */
const runClientApprovalReminders = async () => {
  const results = { success: 0, failed: 0 };
  
  try {
    const success = await sendClientApprovalReminders();
    
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    return results;
  } catch (error) {
    logger.error('Error in runClientApprovalReminders:', error);
    throw error;
  }
};

/**
 * Run the approval notifications process
 * @returns {Promise<Object>} Results of the operation
 */
const runApprovalNotifications = async () => {
  const results = { success: 0, failed: 0 };
  
  try {
    const success = await sendApprovalNotification();
    
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    return results;
  } catch (error) {
    logger.error('Error in runApprovalNotifications:', error);
    throw error;
  }
};

module.exports = {
  initScheduler,
  runMissingTimesheetReminders,
  runClientApprovalReminders,
  runApprovalNotifications
};