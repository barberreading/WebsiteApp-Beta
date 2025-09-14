const Booking = require('../models/Booking');
const Client = require('../models/Client');
const User = require('../models/User');
const Service = require('../models/Service');
const { sendBookingReminder } = require('./emailService');

/**
 * Schedule reminder emails for all upcoming bookings
 * This function should be called when the server starts
 */
const scheduleAllReminders = async () => {
  try {
    // Get all future bookings that haven't been reminded yet
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Find bookings happening tomorrow that haven't been reminded
    const bookings = await Booking.find({
      startTime: { $gte: tomorrow, $lt: dayAfterTomorrow },
      reminderSent: { $ne: true }
    });
    
    logger.log(`Scheduling reminders for ${bookings.length} bookings`);
    
    // Schedule a reminder for each booking
    for (const booking of bookings) {
      await scheduleReminder(booking);
    }
  } catch (error) {
    logger.error('Error scheduling reminders:', error);
  }
};

/**
 * Schedule a reminder email for a specific booking
 * @param {Object} booking - The booking object
 */
const scheduleReminder = async (booking) => {
  try {
    // Get the booking details with populated references
    const fullBooking = await Booking.findById(booking._id);
    const client = await Client.findById(booking.client).select('name email phone');
    const staff = await User.findById(booking.staff).select('name email');
    const service = await Service.findById(booking.service).select('name duration category');
    
    if (!client || !client.email) {
      logger.log(`No client email found for booking ${booking._id}`);
      return;
    }
    
    // Calculate when to send the 24-hour reminder
    const reminderTime24h = new Date(booking.startTime);
    reminderTime24h.setDate(reminderTime24h.getDate() - 1);
    
    // Calculate when to send the 1-hour reminder
    const reminderTime1h = new Date(booking.startTime);
    reminderTime1h.setHours(reminderTime1h.getHours() - 1);
    
    const now = new Date();
    const timeUntil24hReminder = reminderTime24h.getTime() - now.getTime();
    const timeUntil1hReminder = reminderTime1h.getTime() - now.getTime();
    
    // Track if we need to update the booking
    let needsUpdate = false;
    
    // If 24-hour reminder time is in the past, send immediately if not already sent
    if (timeUntil24hReminder <= 0 && !booking.reminderSent) {
      logger.log(`Sending immediate 24h reminder for booking ${booking._id}`);
      await sendBookingReminder(fullBooking, client, staff, service);
      needsUpdate = true;
    } else if (timeUntil24hReminder > 0) {
      // Schedule the 24-hour reminder
      logger.log(`Scheduling 24h reminder for booking ${booking._id} in ${Math.floor(timeUntil24hReminder / 1000 / 60)} minutes`);
      
      setTimeout(async () => {
        try {
          await sendBookingReminder(fullBooking, client, staff, service);
          
          // Mark 24h reminder as sent
          await Booking.findByIdAndUpdate(booking._id, { reminderSent: true });
        } catch (error) {
          logger.error(`Error sending 24h reminder for booking ${booking._id}:`, error);
        }
      }, timeUntil24hReminder);
    }
    
    // If 1-hour reminder time is in the past but booking hasn't started yet, send immediately
    if (timeUntil1hReminder <= 0 && now < booking.startTime && !booking.hourReminderSent) {
      logger.log(`Sending immediate 1h reminder for booking ${booking._id}`);
      await sendBookingReminder(fullBooking, client, staff, service, true); // true indicates 1-hour reminder
      needsUpdate = true;
      booking.hourReminderSent = true;
    } else if (timeUntil1hReminder > 0) {
      // Schedule the 1-hour reminder
      logger.log(`Scheduling 1h reminder for booking ${booking._id} in ${Math.floor(timeUntil1hReminder / 1000 / 60)} minutes`);
      
      setTimeout(async () => {
        try {
          await sendBookingReminder(fullBooking, client, staff, service, true); // true indicates 1-hour reminder
          
          // Mark 1h reminder as sent
          await Booking.findByIdAndUpdate(booking._id, { hourReminderSent: true });
        } catch (error) {
          logger.error(`Error sending 1h reminder for booking ${booking._id}:`, error);
        }
      }, timeUntil1hReminder);
    }
    
    // Update booking if needed
    if (needsUpdate) {
      const updateFields = {};
      if (!booking.reminderSent) updateFields.reminderSent = true;
      if (!booking.hourReminderSent) updateFields.hourReminderSent = true;
      
      if (Object.keys(updateFields).length > 0) {
        await Booking.findByIdAndUpdate(booking._id, updateFields);
      }
    }
  } catch (error) {
    logger.error(`Error scheduling reminder for booking ${booking._id}:`, error);
  }
};

/**
 * Schedule daily check for upcoming bookings that need reminders
 * This runs once a day at midnight
 */
const scheduleDailyReminderCheck = () => {
  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  // Schedule the first check
  setTimeout(() => {
    // Run the reminder check
    scheduleAllReminders();
    
    // Then schedule it to run daily
    setInterval(scheduleAllReminders, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
  
  logger.log(`Scheduled daily reminder check to run in ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
};

module.exports = {
  scheduleAllReminders,
  scheduleReminder,
  scheduleDailyReminderCheck
};