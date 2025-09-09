const { sendEmail } = require('./emailService');
const User = require('../models/User');
const Booking = require('../models/Booking');
const moment = require('moment');

const sendBookingAlertEmail = async (user, alert) => {
  const emailOptions = {
    to: user.email,
    subject: `New Booking Alert: ${alert.title}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>A new booking alert is available:</p>
      <ul>
        <li><strong>Alert:</strong> ${alert.title}</li>
        <li><strong>Date:</strong> ${moment(alert.startTime).format('MMMM Do YYYY')}</li>
        <li><strong>Time:</strong> ${moment(alert.startTime).format('h:mm a')} - ${moment(alert.endTime).format('h:mm a')}</li>
      </ul>
      <p>Please log in to the portal to view details.</p>
    `,
  };
  await sendEmail(emailOptions);
};

const sendBookingAlertClaimedEmail = async (alert, manager, staff) => {
  const emailOptions = {
    to: manager.email,
    subject: `Booking Alert Claimed: ${alert.title}`,
    html: `
      <p>Hi ${manager.name},</p>
      <p>The booking alert "${alert.title}" has been claimed by ${staff.name}.</p>
      <p>Please log in to the portal to review and confirm the booking.</p>
    `,
  };
  await sendEmail(emailOptions);
};

const sendBookingAlertConfirmationEmail = async (alert, staff) => {
  const emailOptions = {
    to: staff.email,
    subject: `Booking Confirmed: ${alert.title}`,
    html: `
      <p>Hi ${staff.name},</p>
      <p>Your claim for the booking alert "${alert.title}" has been confirmed.</p>
      <p>The booking has been added to your schedule.</p>
    `,
  };
  await sendEmail(emailOptions);
};

const sendBookingAlertRejectionEmail = async (alert, staff, reason) => {
  const emailOptions = {
    to: staff.email,
    subject: `Booking Claim Rejected: ${alert.title}`,
    html: `
      <p>Hi ${staff.name},</p>
      <p>Your claim for the booking alert "${alert.title}" has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>The alert is now open for other staff members to claim.</p>
    `,
  };
  await sendEmail(emailOptions);
};

module.exports = {
  sendBookingAlertEmail,
  sendBookingAlertClaimedEmail,
  sendBookingAlertConfirmationEmail,
  sendBookingAlertRejectionEmail,
};