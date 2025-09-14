const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');

const sendLeaveRequestStatusNotification = async (leaveRequest, staff, status) => {
  try {
    // 1. Format dates
    const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
    const endDate = new Date(leaveRequest.endDate).toLocaleDateString();

    // 2. Get the appropriate email template
    const templateName = status === 'approved' ? 'leave-request-approved' : 'leave-request-denied';
    let htmlContent = await getEmailTemplate(templateName);

    if (!htmlContent) {
      // Fallback to a default message if the template is not found
      htmlContent = status === 'approved'
        ? `<p>Your leave request for ${startDate} to ${endDate} has been approved.</p>`
        : `<p>Your leave request for ${startDate} to ${endDate} has been denied. Please contact your manager for more details.</p>`;
    } else {
      // 3. Replace placeholders
      htmlContent = htmlContent.replace('{{staffName}}', staff.name);
      htmlContent = htmlContent.replace('{{startDate}}', startDate);
      htmlContent = htmlContent.replace('{{endDate}}', endDate);
      htmlContent = htmlContent.replace('{{reason}}', leaveRequest.reason);
    }

    // 4. Send the email
    await sendEmail(
      staff.email,
      `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      wrapEmailContent(htmlContent)
    );

    return true;
  } catch (error) {
    logger.error(`Error sending leave request ${status} notification:`, error);
    return false;
  }
};

module.exports = sendLeaveRequestStatusNotification;