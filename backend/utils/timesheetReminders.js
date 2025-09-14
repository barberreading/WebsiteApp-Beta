const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const emailService = require('../modules/email/email.services.js');

/**
 * Send reminders to staff for missing timesheets
 * @param {Date} startDate Start date for timesheet check
 * @param {Date} endDate End date for timesheet check
 * @returns {Promise<Object>} Results of the reminder operation
 */
const sendMissingTimesheetReminders = async (startDate, endDate) => {
  try {
    // Get all active staff
    const staff = await User.find({
      role: 'staff',
      status: 'active'
    });
    
    // Get all timesheets in the date range
    const timesheets = await Timesheet.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Map staff to missing dates
    const staffMap = {};
    
    staff.forEach(staffMember => {
      staffMap[staffMember._id.toString()] = {
        staff: staffMember,
        missingDates: []
      };
    });
    
    // Check each date in the range for each staff
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      staff.forEach(staffMember => {
        const staffId = staffMember._id.toString();
        const hasTimesheet = timesheets.some(ts => 
          ts.staff.toString() === staffId && 
          ts.date.toISOString().split('T')[0] === dateString
        );
        
        if (!hasTimesheet) {
          staffMap[staffId].missingDates.push(new Date(currentDate));
        }
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Filter staff with missing timesheets
    const staffWithMissingTimesheets = Object.values(staffMap)
      .filter(item => item.missingDates.length > 0);
    
    // Send reminders
    const results = {
      total: staffWithMissingTimesheets.length,
      sent: 0,
      failed: 0,
      staffNotified: []
    };
    
    // Send emails asynchronously
    const sendReminders = async () => {
      for (const { staff, missingDates } of staffWithMissingTimesheets) {
        try {
          await emailService.sendMissingTimesheetReminder(staff, missingDates);
          results.sent++;
          results.staffNotified.push(staff.email);
        } catch (error) {
          logger.error(`Failed to send reminder to ${staff.email}:`, error);
          results.failed++;
        }
      }
    };
    
    // Execute the async function
    await sendReminders();
    
    return results;
  } catch (error) {
    logger.error('Error sending missing timesheet reminders:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      staffNotified: []
    };
  }
};

/**
 * Send reminders to clients for pending timesheet approvals
 * @returns {Promise<Object>} Results of the reminder operation
 */
const sendClientApprovalReminders = async () => {
  try {
    // Get timesheets pending approval
    const pendingTimesheets = await Timesheet.find({
      status: 'pending'
    }).populate('staff', 'firstName lastName email')
      .populate('client', 'name email contactName');
    
    // Group by client to avoid sending multiple emails
    const clientMap = {};
    
    pendingTimesheets.forEach(timesheet => {
      if (!timesheet.client) return; // Skip timesheets without clients
      
      const clientId = timesheet.client._id.toString();
      
      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client: timesheet.client,
          timesheets: []
        };
      }
      
      clientMap[clientId].timesheets.push(timesheet);
    });
    
    // Send reminders to clients
    const results = {
      total: Object.keys(clientMap).length,
      sent: 0,
      failed: 0,
      clientsNotified: []
    };
    
    for (const clientId in clientMap) {
      const { client, timesheets } = clientMap[clientId];
      
      try {
        await emailService.sendTimesheetApprovalReminder(client, timesheets);
        results.sent++;
        results.clientsNotified.push(client.email);
      } catch (error) {
        logger.error(`Failed to send reminder to client ${client.email}:`, error);
        results.failed++;
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error sending client approval reminders:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      clientsNotified: []
    };
  }
};

/**
 * Notify staff and managers about pending approvals
 * @param {Array} pendingTimesheets List of timesheets pending approval
 */
const notifyStaffAboutPendingApprovals = async (pendingTimesheets) => {
  try {
    // Group by staff
    const staffMap = {};
    
    pendingTimesheets.forEach(timesheet => {
      if (!timesheet.staff) return;
      
      const staffId = timesheet.staff._id.toString();
      
      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          staff: timesheet.staff,
          timesheets: []
        };
      }
      
      staffMap[staffId].timesheets.push(timesheet);
    });
    
    // Notify each staff member
    for (const staffId in staffMap) {
      const { staff, timesheets } = staffMap[staffId];
      
      try {
        await emailService.sendPendingApprovalNotification(staff, timesheets);
      } catch (error) {
        logger.error(`Failed to notify staff ${staff.email}:`, error);
      }
    }
    
    // Notify managers
    const managers = await User.find({
      role: { $in: ['manager', 'admin'] },
      status: 'active'
    });
    
    for (const manager of managers) {
      try {
        await emailService.sendManagerPendingApprovalSummary(manager, pendingTimesheets);
      } catch (error) {
        logger.error(`Failed to notify manager ${manager.email}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error notifying about pending approvals:', error);
  }
};

/**
 * Send notifications for approved timesheets
 * @returns {Promise<Object>} Results of the notification operation
 */
const sendApprovalNotifications = async () => {
  try {
    // Get recently approved timesheets (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const approvedTimesheets = await Timesheet.find({
      status: 'approved',
      updatedAt: { $gte: oneDayAgo }
    }).populate('staff', 'firstName lastName email')
      .populate('client', 'name email contactName');
    
    // Group by staff
    const staffMap = {};
    
    approvedTimesheets.forEach(timesheet => {
      if (!timesheet.staff) return;
      
      const staffId = timesheet.staff._id.toString();
      
      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          staff: timesheet.staff,
          timesheets: []
        };
      }
      
      staffMap[staffId].timesheets.push(timesheet);
    });
    
    // Send notifications
    const results = {
      total: Object.keys(staffMap).length,
      sent: 0,
      failed: 0,
      staffNotified: []
    };
    
    for (const staffId in staffMap) {
      const { staff, timesheets } = staffMap[staffId];
      
      try {
        await emailService.sendTimesheetApprovedNotification(staff, timesheets);
        results.sent++;
        results.staffNotified.push(staff.email);
      } catch (error) {
        logger.error(`Failed to send notification to ${staff.email}:`, error);
        results.failed++;
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error sending approval notifications:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      staffNotified: []
    };
  }
};

module.exports = {
  sendMissingTimesheetReminders,
  sendClientApprovalReminders,
  sendApprovalNotifications
};