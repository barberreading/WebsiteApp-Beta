const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { wrapEmailContent } = require('../email.template.helper');
const User = require('../../../models/User');
const sendEmail = require('./sendEmail');

const sendLeaveRequestWithdrawalNotification = async (leaveRequest, staff) => {
  try {
    // Find all managers and admins to notify
    const managersAndAdmins = await User.find({ role: { $in: ['manager', 'superuser'] } });

    if (managersAndAdmins.length === 0) {
      logger.log('No managers or admins found to notify of leave withdrawal.');
      return false;
    }

    const transporter = await getEmailTransporter();
    const from = await getSenderInfo();

    // Format dates for the email
    const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
    const endDate = new Date(leaveRequest.endDate).toLocaleDateString();

    // Construct the email content
    const emailContent = `
      <h2>Leave Request Withdrawn</h2>
      <p><strong>Staff Member:</strong> ${staff.name}</p>
      <p><strong>Email:</strong> ${staff.email}</p>
      <p><strong>Leave Dates:</strong> ${startDate} to ${endDate}</p>
      <p>This leave request has been withdrawn by the staff member.</p>
    `;

    // Send email to each manager and admin
    for (const recipient of managersAndAdmins) {
      await sendEmail(
        recipient.email,
        `Leave Request Withdrawn - ${staff.name}`,
        wrapEmailContent(emailContent)
      );
    }

    return true;
  } catch (error) {
    logger.error('Error sending leave request withdrawal notification:', error);
    return false;
  }
};

module.exports = sendLeaveRequestWithdrawalNotification;