const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');

const sendBookingUpdateNotification = async (booking) => {
    try {
      if (!booking.client || !booking.client.email || !booking.staff || !booking.staff.email) {
        throw new Error('Missing client or staff information');
      }

      // Format date and time for email
      const date = new Date(booking.startTime).toLocaleDateString();
      const startTime = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Variables for template
      const variables = {
        clientName: booking.client.name,
        staffName: booking.staff.name,
        serviceName: booking.service.name,
        date: date,
        time: `${startTime} - ${endTime}`,
        status: booking.status
      };
      
      // Get email template
      const template = await getEmailTemplate('booking.updated', variables);
      const emailBody = wrapEmailContent(template.body);
      
      // Send email to client
      await sendEmail(booking.client.email, template.subject, emailBody);
      
      // Send email to staff
      await sendEmail(booking.staff.email, template.subject, emailBody);
      
      return true;
    } catch (error) {
      console.error('Error sending booking update notification:', error);
      return false;
    }
  }

  module.exports = sendBookingUpdateNotification;