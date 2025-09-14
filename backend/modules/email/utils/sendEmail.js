const { getEmailTransporter, getSenderInfo } = require('../email.config');

/**
 * Sends an email.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML content of the email.
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await getEmailTransporter();
    const from = await getSenderInfo();

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;