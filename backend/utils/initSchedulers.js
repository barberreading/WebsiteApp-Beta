/**
 * Initialize all schedulers for the application
 */
const initSchedulers = () => {
  try {
    logger.log('Initializing schedulers...');
    
    // Initialize document reminder scheduler if available
    try {
      const reminderScheduler = require('./reminderScheduler');
      if (reminderScheduler && reminderScheduler.init) {
        reminderScheduler.init();
        logger.log('Document reminder scheduler initialized');
      }
    } catch (error) {
      logger.log('Document reminder scheduler not available:', error.message);
    }
    
    // Initialize timesheet scheduler if available
    try {
      const timesheetScheduler = require('./timesheetScheduler');
      if (timesheetScheduler && timesheetScheduler.init) {
        timesheetScheduler.init();
        logger.log('Timesheet scheduler initialized');
      }
    } catch (error) {
      logger.log('Timesheet scheduler not available:', error.message);
    }
    
    logger.log('Schedulers initialization completed');
  } catch (error) {
    logger.error('Error initializing schedulers:', error);
  }
};

module.exports = {
  initSchedulers
};