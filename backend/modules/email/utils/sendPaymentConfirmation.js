const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');

const sendPaymentConfirmation = async (invoice, client, booking, service, user) => {
  try {
    const { subject, body } = await getEmailTemplate('payment_confirmation', {
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: `£${invoice.amount.toFixed(2)}`,
      serviceName: service.name,
      serviceDate: new Date(booking.startTime).toLocaleDateString(),
    });

    const info = await sendEmail(client.email, subject, wrapEmailContent(body, subject));

    console.log('Payment confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
};

module.exports = { sendPaymentConfirmation };