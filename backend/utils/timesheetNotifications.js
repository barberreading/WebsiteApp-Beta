const cron = require('node-cron');
const Booking = require('../models/Booking');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const { 
  sendTimesheetReminder, 
  sendTimesheetSubmissionReminder, 
  sendTimesheetStatusNotification 
} = require('./emailService');

/**
 * Schedule all timesheet notification jobs
 */
const scheduleTimesheetNotifications = () => {
  // Schedule booking reminders (15 minutes before booking)
  scheduleBookingStartReminders();
  
  // Schedule clock out reminders (10 minutes after booking end)
  scheduleBookingEndReminders();
  
  // Schedule daily submission reminders (7:00 PM)
  scheduleDailySubmissionReminders();
  
  // Schedule Sunday lockout reminders (1:00 PM)
  scheduleSundayLockoutReminders();
  
  logger.log('Timesheet notification jobs scheduled');
};

/**
 * Schedule reminders for upcoming bookings (15 minutes before)
 */
const scheduleBookingStartReminders = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);
      
      // Find bookings starting in 15-20 minutes
      const upcomingBookings = await Booking.find({
        startTime: { 
          $gte: fifteenMinutesFromNow,
          $lt: twentyMinutesFromNow
        },
        status: 'confirmed'
      }).populate('staff');
      
      // Send reminders for each booking
      for (const booking of upcomingBookings) {
        if (booking.staff && booking.staff.email) {
          await sendTimesheetReminder(booking, booking.staff, true);
        }
      }
    } catch (error) {
      logger.error('Error sending booking start reminders:', error);
    }
  });
};

/**
 * Schedule reminders for completed bookings (10 minutes after)
 */
const scheduleBookingEndReminders = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      
      // Find bookings that ended 10-15 minutes ago
      const completedBookings = await Booking.find({
        endTime: { 
          $gte: fifteenMinutesAgo,
          $lt: tenMinutesAgo
        },
        status: 'confirmed'
      }).populate('staff');
      
      // Send reminders for each booking
      for (const booking of completedBookings) {
        if (booking.staff && booking.staff.email) {
          await sendTimesheetReminder(booking, booking.staff, false);
        }
      }
    } catch (error) {
      logger.error('Error sending booking end reminders:', error);
    }
  });
};

/**
 * Schedule daily submission reminders (7:00 PM)
 */
const scheduleDailySubmissionReminders = () => {
  // Run at 7:00 PM every day
  cron.schedule('0 19 * * *', async () => {
    try {
      // Get all staff users
      const staffUsers = await User.find({
        role: 'staff'
      });
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Send reminders to each staff member with pending timesheets
      for (const staff of staffUsers) {
        // Find pending timesheets for this staff member
        const pendingTimesheets = await Timesheet.find({
          user: staff._id,
          date: today,
          status: 'pending'
        });
        
        if (pendingTimesheets.length > 0) {
          await sendTimesheetSubmissionReminder(staff, pendingTimesheets, false);
        }
      }
    } catch (error) {
      logger.error('Error sending daily submission reminders:', error);
    }
  });
};

/**
 * Schedule Sunday lockout reminders (1:00 PM)
 */
const scheduleSundayLockoutReminders = () => {
  // Run at 1:00 PM every Sunday
  cron.schedule('0 13 * * 0', async () => {
    try {
      // Get all staff users
      const staffUsers = await User.find({
        role: 'staff'
      });
      
      // Get start of current week (Sunday)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Send reminders to each staff member with pending timesheets
      for (const staff of staffUsers) {
        // Find pending timesheets for this staff member from the current week
        const pendingTimesheets = await Timesheet.find({
          user: staff._id,
          date: { $gte: startOfWeek },
          status: 'pending'
        });
        
        if (pendingTimesheets.length > 0) {
          await sendTimesheetSubmissionReminder(staff, pendingTimesheets, true);
        }
      }
    } catch (error) {
      logger.error('Error sending Sunday lockout reminders:', error);
    }
  });
};

module.exports = {
  scheduleTimesheetNotifications
};