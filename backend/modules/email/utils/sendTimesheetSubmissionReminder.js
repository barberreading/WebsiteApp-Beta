const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');

const sendTimesheetSubmissionReminder = async (staff, pendingTimesheets, isLockoutReminder) => {
  try {
    const templateType = isLockoutReminder ? 'timesheet_lockout_reminder' : 'timesheet_submission_reminder';

    let timesheetsList = '';
    pendingTimesheets.forEach(timesheet => {
      const date = new Date(timesheet.date).toLocaleDateString();
      timesheetsList += `<li>${date} - ${timesheet.hours} hours</li>`;
    });

    const { subject, body } = await getEmailTemplate(templateType, {
      staffName: staff.name,
      pendingCount: pendingTimesheets.length,
      timesheetsList,
    });

    const info = await sendEmail(staff.email, subject, wrapEmailContent(body, subject));

    logger.log('Timesheet submission reminder email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending timesheet submission reminder email:', error);
    throw error;
  }
};

module.exports = { sendTimesheetSubmissionReminder };