const { getEmailTransporter, getSenderInfo } = require('../email.config');
const { wrapEmailContent } = require('../email.template.helper');
const User = require('../../../models/User');
const Booking = require('../../../models/Booking');
const { sendEmail } = require('../email.services');

const sendLeaveRequestSubmissionNotification = async (leaveRequest, staff) => {
    try {
      // Find all managers and admins
      const managersAndAdmins = await User.find({
        role: { $in: ['manager', 'superuser'] }
      });
      
      if (managersAndAdmins.length === 0) {
        console.log('No managers or admins found to notify');
        return false;
      }
      
      // Find conflicting bookings
      const conflictingBookings = await Booking.find({
        staff: staff._id,
        $or: [
          {
            startTime: {
              $gte: new Date(leaveRequest.startDate),
              $lt: new Date(new Date(leaveRequest.endDate).getTime() + 24 * 60 * 60 * 1000)
            }
          },
          {
            endTime: {
              $gt: new Date(leaveRequest.startDate),
              $lte: new Date(new Date(leaveRequest.endDate).getTime() + 24 * 60 * 60 * 1000)
            }
          }
        ],
        status: { $ne: 'cancelled' }
      }).populate('client', 'name').populate('service', 'name');
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      
      // Create conflict details
      let conflictDetails = '';
      if (conflictingBookings.length > 0) {
        conflictDetails = '<h3>Conflicting Bookings:</h3><ul>';
        conflictingBookings.forEach(booking => {
          const bookingDate = new Date(booking.startTime).toLocaleDateString();
          const bookingTime = `${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          conflictDetails += `<li>${bookingDate} ${bookingTime} - ${booking.service?.name || 'Service'} with ${booking.client?.name || 'Client'}</li>`;
        });
        conflictDetails += '</ul>';
      } else {
        conflictDetails = '<p>No conflicting bookings found.</p>';
      }
      
      // Send email to each manager/admin
      for (const manager of managersAndAdmins) {
        const emailContent = `
          <h2>New Leave Request Submitted</h2>
          <p><strong>Staff Member:</strong> ${staff.name}</p>
          <p><strong>Email:</strong> ${staff.email}</p>
          <p><strong>Leave Dates:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Reason:</strong> ${leaveRequest.reason}</p>
          ${conflictDetails}
          <p>Please review this request in the staff management system.</p>
        `;
        
        await sendEmail({
          to: manager.email,
          subject: `New Leave Request - ${staff.name}`,
          html: wrapEmailContent(emailContent)
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending leave request submission notification:', error);
      return false;
    }
  }

  module.exports = sendLeaveRequestSubmissionNotification;