const { getEmailTransporter, getSenderInfo } = require('./email.config');
const { getEmailTemplate } = require('./email.templates');
const { wrapEmailContent } = require('./email.template.helper');
const sendBookingConfirmation = require('./utils/sendBookingConfirmation');
const sendBookingReminder = require('./utils/sendBookingReminder');
const sendInvoice = require('./utils/sendInvoice');
const sendPaymentConfirmation = require('./utils/sendPaymentConfirmation');
const sendPasswordResetEmail = require('../password-reset/password-reset.services');
const sendTimesheetSubmissionReminder = require('./utils/sendTimesheetSubmissionReminder');
const sendNewUserEmail = require('../users/users.services');
const sendTimesheetReminder = require('./utils/sendTimesheetReminder');
const sendTimesheetStatusNotification = require('./utils/sendTimesheetStatusNotification');
const sendTestEmail = require('./utils/sendTestEmail');
const sendBookingUpdateNotification = require('./utils/sendBookingUpdateNotification');
const sendBookingCancellationNotification = require('./utils/sendBookingCancellationNotification');
const sendLeaveRequestSubmissionNotification = require('./utils/sendLeaveRequestSubmissionNotification');
const sendLeaveRequestStatusNotification = require('./utils/sendLeaveRequestStatusNotification');
const sendLeaveRequestWithdrawalNotification = require('./utils/sendLeaveRequestWithdrawalNotification');
const { sendEmail } = require('./utils/sendEmail');

module.exports = {
    getEmailTransporter,
    getSenderInfo,
    getEmailTemplate,
    wrapEmailContent,
    sendBookingConfirmation,
    sendBookingReminder,
    sendInvoice,
    sendPaymentConfirmation,
    sendPasswordResetEmail,
    sendTimesheetSubmissionReminder,
    sendNewUserEmail,
    sendTimesheetReminder,
    sendTimesheetStatusNotification,
    sendTestEmail,
    sendBookingUpdateNotification,
    sendBookingCancellationNotification,
    sendLeaveRequestSubmissionNotification,
    sendLeaveRequestStatusNotification,
    sendLeaveRequestWithdrawalNotification,
    sendEmail
};