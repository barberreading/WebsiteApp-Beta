const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper.js');
const sendEmail = require('./sendEmail');

/**
 * Send timesheet reminder email
 * @param {Object} user - The user object
 * @param {Array} missingTimesheets - Array of missing timesheets
 */
const sendTimesheetReminder = async (user, missingTimesheets) => {
  try {
    // Get template
    const { subject, body } = await getEmailTemplate('timesheet_reminder', {
      userName: user.name,
      timesheetLink: `${process.env.FRONTEND_URL}/timesheets`
    });
    
    // Send email
    await sendEmail(user.email, subject, wrapEmailContent(body, subject));
    
    logger.log('Timesheet reminder email sent:');
  } catch (error) {
    logger.error('Error sending timesheet reminder email:', error);
    throw error;
  }
};

module.exports = { sendTimesheetReminder };