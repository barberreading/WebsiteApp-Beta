/**
 * Initialize all schedulers for the application
 */
const initSchedulers = () => {
  try {
    console.log('Initializing schedulers...');
    
    // Initialize document reminder scheduler if available
    try {
      const reminderScheduler = require('./reminderScheduler');
      if (reminderScheduler && reminderScheduler.init) {
        reminderScheduler.init();
        console.log('Document reminder scheduler initialized');
      }
    } catch (error) {
      console.log('Document reminder scheduler not available:', error.message);
    }
    
    // Initialize timesheet scheduler if available
    try {
      const timesheetScheduler = require('./timesheetScheduler');
      if (timesheetScheduler && timesheetScheduler.init) {
        timesheetScheduler.init();
        console.log('Timesheet scheduler initialized');
      }
    } catch (error) {
      console.log('Timesheet scheduler not available:', error.message);
    }
    
    console.log('Schedulers initialization completed');
  } catch (error) {
    console.error('Error initializing schedulers:', error);
  }
};

module.exports = {
  initSchedulers
};