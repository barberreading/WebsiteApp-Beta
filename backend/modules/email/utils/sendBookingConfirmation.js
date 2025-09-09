const { getEmailTemplate } = require('../email.templates');
const { wrapEmailContent } = require('../email.template.helper.js');
const StaffDocument = require('../../../models/StaffDocument');
const sendEmail = require('./sendEmail');

/**
 * @description Sends a booking confirmation email to the client, including links to relevant staff documents if sharing is enabled.
 * @param {object} booking - The booking object.
 * @param {object} client - The client object.
 * @param {object} staff - The staff member object.
 * @param {object} service - The service object.
 * @returns {Promise<void>}
 * @throws {Error} If there is an error sending the email.
 */
const sendBookingConfirmation = async (booking, client, staff, service) => {
  try {
    // Format date and time
    const date = new Date(booking.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const time = new Date(booking.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Get template
    const { subject, body } = await getEmailTemplate('booking_confirmation', {
      clientName: client.name,
      staffName: staff.name,
      serviceName: service.name,
      date,
      time,
      duration: `${service.duration} minutes`,
      location: booking.location || 'Not specified',
      notes: booking.notes || 'No additional notes'
    });
    
    // Add staff links if available
    let emailBody = body;
    
    // Check if staff has documents and if they should be shared
    if (staff.documentSharing) {
      try {
        const staffDocuments = await StaffDocument.find({ staff: staff._id });
        
        if (staffDocuments && staffDocuments.length > 0) {
          let linksHtml = '<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">';
          linksHtml += '<h3 style="margin-top: 0; color: #333;">Staff Documents</h3>';
          
          // Add profile link if sharing is enabled
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
          
          // Add DBS certificate link if available and sharing is enabled
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
          
          // Add risk assessment link if available and sharing is enabled
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
          
          // Add links to email body
          emailBody += linksHtml;
        }
      } catch (error) {
        console.error('Error fetching staff documents:', error);
      }
    }
    
    // Send email to client
    if (client && client.email) {
      await sendEmail(client.email, subject, wrapEmailContent(emailBody, subject));
      console.log('Booking confirmation email sent to client.');
    }
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

module.exports = sendBookingConfirmation;