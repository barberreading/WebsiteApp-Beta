const Booking = require('../../models/Booking');
const User = require('../../models/User');
const emailService = require('../email/email.services.js');
const logger = require('../logging/logging.services');

const sendClockInReminders = async () => {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
    
    const upcomingBookings = await Booking.find({
      startTime: { 
        $gte: now,
        $lte: thirtyMinutesFromNow
      },
      status: { $ne: 'cancelled' }
    }).populate('staff', 'email firstName lastName').populate('client', 'name');
    
    let remindersSent = 0;
    
    for (const booking of upcomingBookings) {
      if (!booking.staff || !booking.staff.email) continue;
      
      const clientName = booking.client ? booking.client.name : 'No client assigned';
      const bookingTime = booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const bookingDate = booking.startTime.toLocaleDateString();
      
      const emailData = {
        to: booking.staff.email,
        subject: 'Reminder: Clock In for Your Upcoming Booking',
        text: `Hello ${booking.staff.firstName},\n\nThis is a reminder to clock in for your booking with ${clientName} at ${bookingTime} on ${bookingDate}.\n\nPlease use the Clock In/Out page to record your time.\n\nThank you!`,
        html: `
          <p>Hello ${booking.staff.firstName},</p>
          <p>This is a reminder to clock in for your booking with <strong>${clientName}</strong> at <strong>${bookingTime}</strong> on <strong>${bookingDate}</strong>.</p>
          <p>Please use the Clock In/Out page to record your time.</p>
          <p>Thank you!</p>
        `
      };
      
      await emailService.sendEmail(emailData);
      remindersSent++;
      
      logger.info(`Clock-in reminder sent to ${booking.staff.email} for booking at ${booking.startTime}`);
    }
    
    return {
      success: true,
      remindersSent,
      message: `Sent ${remindersSent} clock-in reminders`
    };
  } catch (error) {
    logger.error(`Error sending clock-in reminders: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

const sendClockOutReminders = async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000);
    
    const completedBookings = await Booking.find({
      endTime: { 
        $gte: fifteenMinutesAgo,
        $lte: now
      },
      status: { $ne: 'cancelled' }
    }).populate('staff', 'email firstName lastName').populate('client', 'name');
    
    let remindersSent = 0;
    
    for (const booking of completedBookings) {
      if (!booking.staff || !booking.staff.email) continue;
      
      const clientName = booking.client ? booking.client.name : 'No client assigned';
      const bookingEndTime = booking.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const emailData = {
        to: booking.staff.email,
        subject: 'Reminder: Clock Out from Your Completed Booking',
        text: `Hello ${booking.staff.firstName},\n\nYour booking with ${clientName} has ended at ${bookingEndTime}.\n\nPlease remember to clock out and update any break times on the Clock In/Out page.\n\nThank you!`,
        html: `
          <p>Hello ${booking.staff.firstName},</p>
          <p>Your booking with <strong>${clientName}</strong> has ended at <strong>${bookingEndTime}</strong>.</p>
          <p>Please remember to clock out and update any break times on the Clock In/Out page.</p>
          <p>Thank you!</p>
        `
      };
      
      await emailService.sendEmail(emailData);
      remindersSent++;
      
      logger.info(`Clock-out reminder sent to ${booking.staff.email} for booking that ended at ${booking.endTime}`);
    }
    
    return {
      success: true,
      remindersSent,
      message: `Sent ${remindersSent} clock-out reminders`
    };
  } catch (error) {
    logger.error(`Error sending clock-out reminders: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendClockInReminders,
  sendClockOutReminders
};