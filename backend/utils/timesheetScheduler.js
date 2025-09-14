const cron = require('node-cron');
const mongoose = require('mongoose');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const { 
  sendTimesheetApprovalRequest, 
  sendUnapprovedTimesheetReminder,
  sendMissingTimesheetReminder,
  sendTimesheetApprovalNotification,
  sendTimesheetApprovalStatusUpdate
} = require('../modules/email/email.services');

/**
 * Schedule daily check for timesheets that need approval
 */
const scheduleDailyTimesheetCheck = () => {
  // Run every day at 6:00 PM to send approval requests for completed timesheets
  cron.schedule('0 18 * * *', async () => {
    try {
      logger.log('Running daily timesheet approval request check...');
      
      // Find all timesheets from today that are pending and haven't had approval requests sent
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timesheets = await Timesheet.find({
        date: today,
        status: 'pending',
        approvalRequestSent: { $ne: true }
      }).populate('staff').populate('client');
      
      logger.log(`Found ${timesheets.length} timesheets needing approval requests`);
      
      // Send approval requests for each timesheet
      for (const timesheet of timesheets) {
        try {
          await sendTimesheetApprovalRequest(
            timesheet,
            timesheet.client,
            timesheet.staff
          );
          
          // Mark as sent
          timesheet.approvalRequestSent = true;
          await timesheet.save();
          
          logger.log(`Sent approval request for timesheet ${timesheet._id}`);
        } catch (error) {
          logger.error(`Error sending approval request for timesheet ${timesheet._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in daily timesheet approval check:', error);
    }
  });
  
  // Run every Monday at 10:00 AM to send reminders for missing and unapproved timesheets
  cron.schedule('0 10 * * 1', async () => {
    try {
      logger.log('Running weekly timesheet reminder check...');
      
      // Get date range for last week (Monday to Sunday)
      const today = new Date();
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay()); // Last Sunday
      lastWeekEnd.setHours(23, 59, 59, 999);
      
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Last Monday
      lastWeekStart.setHours(0, 0, 0, 0);
      
      logger.log(`Checking timesheets for period: ${lastWeekStart.toDateString()} to ${lastWeekEnd.toDateString()}`);
      
      // 1. CROSS-REFERENCE BOOKINGS WITH TIMESHEETS TO FIND MISSING TIMESHEETS
      // Find all bookings from last week
      const lastWeekBookings = await Booking.find({
        date: { $gte: lastWeekStart, $lte: lastWeekEnd },
        status: { $in: ['confirmed', 'completed'] }
      }).populate('staff').populate('client');
      
      logger.log(`Found ${lastWeekBookings.length} bookings from last week`);
      
      // Group bookings by staff
      const bookingsByStaff = {};
      lastWeekBookings.forEach(booking => {
        if (booking.staff) {
          const staffId = booking.staff._id.toString();
          if (!bookingsByStaff[staffId]) {
            bookingsByStaff[staffId] = {
              staff: booking.staff,
              bookings: []
            };
          }
          bookingsByStaff[staffId].bookings.push(booking);
        }
      });
      
      // Find all timesheets from last week
      const lastWeekTimesheets = await Timesheet.find({
        date: { $gte: lastWeekStart, $lte: lastWeekEnd }
      });
      
      logger.log(`Found ${lastWeekTimesheets.length} timesheets from last week`);
      
      // Group timesheets by staff and date
      const timesheetsByStaffAndDate = {};
      lastWeekTimesheets.forEach(timesheet => {
        const staffId = timesheet.staff.toString();
        const dateStr = timesheet.date.toISOString().split('T')[0];
        
        if (!timesheetsByStaffAndDate[staffId]) {
          timesheetsByStaffAndDate[staffId] = {};
        }
        
        timesheetsByStaffAndDate[staffId][dateStr] = true;
      });
      
      // Find missing timesheets
      const missingTimesheetsByStaff = {};
      
      Object.keys(bookingsByStaff).forEach(staffId => {
        const staffBookings = bookingsByStaff[staffId].bookings;
        const missingDates = [];
        
        staffBookings.forEach(booking => {
          const bookingDateStr = booking.date.toISOString().split('T')[0];
          
          // Check if timesheet exists for this date
          if (!timesheetsByStaffAndDate[staffId] || !timesheetsByStaffAndDate[staffId][bookingDateStr]) {
            missingDates.push({
              date: booking.date,
              client: booking.client,
              bookingId: booking._id
            });
          }
        });
        
        if (missingDates.length > 0) {
          missingTimesheetsByStaff[staffId] = {
            staff: bookingsByStaff[staffId].staff,
            missingDates
          };
        }
      });
      
      // Send reminders for missing timesheets
      for (const staffId in missingTimesheetsByStaff) {
        const { staff, missingDates } = missingTimesheetsByStaff[staffId];
        
        await sendMissingTimesheetReminder(staff, missingDates);
        logger.log(`Sent missing timesheet reminder to ${staff.firstName} ${staff.lastName} for ${missingDates.length} dates`);
      }
      
      // 2. SEND REMINDERS FOR UNAPPROVED TIMESHEETS
      // Find all clients with unapproved timesheets
      const clients = await Client.find();
      
      for (const client of clients) {
        // Find unapproved timesheets for this client
        const unapprovedTimesheets = await Timesheet.find({
          client: client._id,
          status: 'pending',
          date: { $gte: lastWeekStart, $lte: lastWeekEnd },
          approvalRequestSent: true
        }).populate('staff');
        
        if (unapprovedTimesheets.length > 0) {
          // Format timesheet data for email
          const timesheetData = unapprovedTimesheets.map(ts => ({
            _id: ts._id,
            date: ts.date,
            staffName: `${ts.staff.firstName} ${ts.staff.lastName}`,
            totalHours: ts.totalHours
          }));
          
          // Send reminder email to client
          await sendUnapprovedTimesheetReminder(timesheetData, client);
          logger.log(`Sent reminder for ${unapprovedTimesheets.length} timesheets to client ${client.name}`);
          
          // Also notify staff and managers about pending approval
          for (const timesheet of unapprovedTimesheets) {
            await sendTimesheetApprovalStatusUpdate(timesheet, 'awaiting_approval');
          }
          
          // Notify managers
          const managers = await User.find({ role: { $in: ['manager', 'superuser'] } });
          for (const manager of managers) {
            // Send manager notification about unapproved timesheets
            logger.log(`Notified manager ${manager.firstName} ${manager.lastName} about unapproved timesheets for client ${client.name}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error in weekly timesheet reminder check:', error);
    }
  });
  
  logger.log('Timesheet reminder scheduler initialized');
};

module.exports = {
  scheduleDailyTimesheetCheck
};