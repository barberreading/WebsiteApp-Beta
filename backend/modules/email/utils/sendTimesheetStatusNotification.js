const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const sendEmail = require('./sendEmail');

/**
 * Send timesheet status notification email
 * @param {Object} timesheet - The timesheet object
 * @param {Object} staff - The staff object
 * @param {string} status - The new status (submitted, approved, rejected)
 * @param {string} rejectionReason - Optional reason for rejection
 */
const sendTimesheetStatusNotification = async (timesheet, staff, status, rejectionReason = '') => {
  try {
    // Format date
    const date = new Date(timesheet.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Get template type based on status
    let templateType = 'timesheet_submitted';
    let statusText = 'submitted';
    let statusColor = '#3498db';
    
    if (status === 'approved') {
      templateType = 'timesheet_approved';
      statusText = 'approved';
      statusColor = '#2ecc71';
    } else if (status === 'rejected') {
      templateType = 'timesheet_rejected';
      statusText = 'rejected';
      statusColor = '#e74c3c';
    }
    
    // Get template or use fallback
    let subject = `Timesheet ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
    let body = `
      <h2>Timesheet ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
      <p>Hello ${staff.name},</p>
      <p>Your timesheet for ${date} has been <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.</p>
      <ul>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Hours:</strong> ${timesheet.hours}</li>
        <li><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</span></li>
        ${rejectionReason ? `<li><strong>Reason for Rejection:</strong> ${rejectionReason}</li>` : ''}
      </ul>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/timesheets" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Timesheets</a></p>
    `;
    
    try {
      const template = await getEmailTemplate(templateType, {
        staffName: staff.name,
        date,
        hours: timesheet.hours,
        rejectionReason
      });
      
      if (template) {
        subject = template.subject;
        body = template.body;
      }
    } catch (error) {
      logger.log(`Using fallback template for timesheet ${status} notification`);
    }
    
    // Send email
    const info = await sendEmail(staff.email, subject, body);
    
    logger.log(`Timesheet ${status} notification email sent:`, info.messageId);
    return info;
  } catch (error) {
    logger.error(`Error sending timesheet ${status} notification email:`, error);
    throw error;
  }
};

module.exports = sendTimesheetStatusNotification;