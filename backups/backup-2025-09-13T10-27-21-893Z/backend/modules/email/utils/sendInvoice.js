const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');
const { getBrandingForEmail } = require('./getBrandingForEmail');

const sendInvoice = async (invoice, client, booking, service, user) => {
  try {
    const { subject, body } = await getEmailTemplate('invoice', {
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.date).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      serviceName: service.name,
      serviceDate: new Date(booking.startTime).toLocaleDateString(),
      amount: `£${invoice.amount.toFixed(2)}`,
      paymentLink: `${process.env.FRONTEND_URL}/payment/${invoice._id}`,
    });

    const branding = await getBrandingForEmail();
  const info = await sendEmail(client.email, subject, wrapEmailContent(body, subject, branding));

    console.log('Invoice email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

module.exports = sendInvoice;