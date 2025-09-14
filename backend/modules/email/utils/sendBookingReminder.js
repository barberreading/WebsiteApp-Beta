const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper');
const sendEmail = require('./sendEmail');
const { getBrandingForEmail } = require('./getBrandingForEmail');
const StaffDocument = require('../../../models/StaffDocument');

/**
 * @description Sends a booking reminder email to the client, including links to relevant staff documents if sharing is enabled.
 * @param {object} booking - The booking object.
 * @param {object} client - The client object.
 * @param {object} staff - The staff member object.
 * @param {object} service - The service object.
 * @returns {Promise<object>} - A promise that resolves to the info object from Nodemailer.
 * @throws {Error} If there is an error sending the email.
 */
const sendBookingReminder = async (booking, client, staff, service) => {
  try {
    const date = new Date(booking.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const time = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const { subject, body } = await getEmailTemplate('booking_reminder', {
      clientName: client.name,
      staffName: staff.name,
      serviceName: service.name,
      date,
      time,
      duration: `${service.duration} minutes`,
      location: booking.location || 'Not specified',
      notes: booking.notes || 'No additional notes',
    });

    let emailBody = body;

    if (staff.documentSharing) {
      try {
        const staffDocuments = await StaffDocument.find({ staff: staff._id });

        if (staffDocuments && staffDocuments.length > 0) {
          let linksHtml = `<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">`;
          linksHtml += '<h3 style="margin-top: 0; color: #333;">Staff Documents</h3>';

          if (staff.documentSharing.shareProfile) {
            linksHtml += `
              <div style="margin-bottom: 10px;">
                <a href="${process.env.FRONTEND_URL}/staff-profile/${staff._id}" 
                   style="color: #007bff; text-decoration: none; font-weight: bold;">
                  View Staff Profile
                </a>
              </div>
            `;
          }

          const dbsDoc = staffDocuments.find(doc => doc.type === 'dbs');
          if (dbsDoc && dbsDoc.publicUrl && staff.documentSharing.shareDBS) {
            linksHtml += `
              <div style="margin-bottom: 10px;">
                <a href="${dbsDoc.publicUrl}" 
                   style="color: #007bff; text-decoration: none; font-weight: bold;">
                  View DBS Certificate
                </a>
              </div>
            `;
          }

          const riskDoc = staffDocuments.find(doc => doc.type === 'risk_assessment');
          if (riskDoc && riskDoc.publicUrl && staff.documentSharing.shareRiskAssessment) {
            linksHtml += `
              <div style="margin-bottom: 10px;">
                <a href="${riskDoc.publicUrl}" 
                   style="color: #007bff; text-decoration: none; font-weight: bold;">
                  View Risk Assessment
                </a>
              </div>
            `;
          }

          linksHtml += '</div>';

          emailBody += linksHtml;
        }
      } catch (error) {
        logger.error('Error fetching staff documents:', error);
      }
    }

    const branding = await getBrandingForEmail();
    const info = await sendEmail(client.email, subject, wrapEmailContent(emailBody, subject, branding));

    logger.log('Booking reminder email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending booking reminder email:', error);
    throw error;
  }
};

module.exports = { sendBookingReminder };