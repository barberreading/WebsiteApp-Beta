const BookingAlert = require('../../models/BookingAlert');
const BookingAlertTemplate = require('../../models/BookingAlertTemplate');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const ErrorResponse = require('../../utils/errorResponse');
const {
  sendBookingAlertEmail,
  sendBookingAlertClaimedEmail,
  sendBookingAlertConfirmationEmail,
  sendBookingAlertRejectionEmail,
} = require('../../utils/bookingAlertEmails');
const mongoose = require('mongoose');

const getAvailableBookingAlerts = async (staffId, requestingUser) => {
  let query = {
    status: 'open',
    'rejectedStaff.staffId': { $ne: staffId },
  };
  
  // Handle test user data isolation for booking alerts
  if (requestingUser && requestingUser.role !== 'superuser') {
    const testUsers = await User.find({ isTestUser: true }).select('_id');
    const testUserIds = testUsers.map(u => u._id);
    
    if (testUserIds.length > 0) {
      if (requestingUser.isTestUser) {
        // Test users should only see alerts for test clients
        query.client = { $in: testUserIds };
      } else {
        // Regular users should not see alerts for test clients
        query.client = { $nin: testUserIds };
      }
    }
  }
  
  return BookingAlert.find(query).populate('service location');
 };

const getBookingAlert = async (alertId) => {
  const alert = await BookingAlert.findById(alertId).populate(
    'service location claimedBy rejectedStaff.staffId'
  );

  if (!alert) {
    throw new ErrorResponse(`Booking alert not found with id of ${alertId}`, 404);
  }

  return alert;
};

const createBookingAlert = async (alertBody, user) => {
  alertBody.createdBy = user.id;

  const { staff, isMultiDay, bookingDays } = alertBody;

  let createdAlerts = [];

  if (isMultiDay && bookingDays && bookingDays.length > 0) {
    for (const day of bookingDays) {
      const alertData = {
        ...alertBody,
        startTime: day.startTime,
        endTime: day.endTime,
        bookingKey: new mongoose.Types.ObjectId().toHexString(),
      };
      const newAlert = await BookingAlert.create(alertData);
      createdAlerts.push(newAlert);
      if (staff && staff.length > 0) {
        const staffUsers = await User.find({ _id: { $in: staff } });
        for (const user of staffUsers) {
          await sendBookingAlertEmail(user, newAlert);
        }
      }
    }
  } else {
    const newAlert = await BookingAlert.create(alertBody);
    createdAlerts.push(newAlert);
    if (staff && staff.length > 0) {
      const staffUsers = await User.find({ _id: { $in: staff } });
      for (const user of staffUsers) {
        await sendBookingAlertEmail(user, newAlert);
      }
    }
  }

  return createdAlerts;
};

const confirmBookingAlert = async (alertId, user) => {
  const alert = await BookingAlert.findById(alertId).populate('claimedBy');

  if (!alert) {
    throw new ErrorResponse(`Booking alert not found with id of ${alertId}`, 404);
  }

  if (alert.status !== 'pending_confirmation' && alert.status !== 'claimed') {
    throw new ErrorResponse('This alert is not awaiting confirmation.', 400);
  }

  const newBooking = await Booking.create({
    title: alert.title,
    description: alert.description,
    startTime: alert.startTime,
    endTime: alert.endTime,
    service: alert.service,
    staff: [alert.claimedBy._id],
    client: alert.client,
    manager: user.id,
    location: alert.location,
    status: 'confirmed',
    bookingKey: alert.bookingKey,
    isMultiDay: alert.isMultiDay,
    bookingDays: alert.bookingDays,
    notes: alert.description,
    createdBy: user.id,
    locationArea: alert.locationArea,
  });

  alert.status = 'confirmed';
  alert.booking = newBooking._id;
  await alert.save();

  await sendBookingAlertConfirmationEmail(alert, alert.claimedBy);

  return newBooking;
};

const rejectBookingAlert = async (alertId, reason) => {
  if (!reason) {
    throw new ErrorResponse('Please provide a reason for rejection', 400);
  }

  const alert = await BookingAlert.findById(alertId).populate('claimedBy');

  if (!alert) {
    throw new ErrorResponse(`Booking alert not found with id of ${alertId}`, 404);
  }

  if (alert.status !== 'pending_confirmation') {
    throw new ErrorResponse('This alert is not awaiting confirmation', 400);
  }

  const rejectedStaffUser = alert.claimedBy;

  const rejectedStaff = [...alert.rejectedStaff];
  rejectedStaff.push({
    staffId: alert.claimedBy,
    rejectedAt: Date.now(),
    reason,
  });

  const updatedAlert = await BookingAlert.findByIdAndUpdate(
    alertId,
    {
      status: 'open',
      claimedBy: null,
      claimedAt: null,
      rejectedStaff,
      rejectionReason: reason,
    },
    { new: true, runValidators: true }
  );

  await sendBookingAlertRejectionEmail(alert, rejectedStaffUser, reason);

  return updatedAlert;
};

const cancelBookingAlert = async (alertId) => {
  let bookingAlert = await BookingAlert.findById(alertId);

  if (!bookingAlert) {
    throw new ErrorResponse(`Booking alert not found with id of ${alertId}`, 404);
  }

  return BookingAlert.findByIdAndUpdate(
    alertId,
    { status: 'cancelled' },
    { new: true, runValidators: true }
  );
};

const claimBookingAlert = async (alertId, user) => {
  const alert = await BookingAlert.findById(alertId);

  if (!alert) {
    throw new ErrorResponse(`Booking alert not found with id of ${alertId}`, 404);
  }

  if (alert.status !== 'open') {
    throw new ErrorResponse('Booking alert is not open for claiming', 400);
  }

  if (user.role !== 'staff') {
    throw new ErrorResponse('Only staff members can claim alerts', 403);
  }

  if (alert.rejectedStaff.some(rs => rs.staffId.toString() === user.id)) {
    throw new ErrorResponse(
      'You have been rejected for this alert and cannot claim it again.',
      403
    );
  }

  alert.status = 'pending_confirmation';
  alert.claimedBy = user.id;
  await alert.save();

  const managers = await User.find({ role: { $in: ['manager', 'superuser'] } });
  for (const manager of managers) {
    await sendBookingAlertClaimedEmail(alert, manager, user);
  }

  return alert;
};

module.exports = {
  getAvailableBookingAlerts,
  getBookingAlert,
  createBookingAlert,
  confirmBookingAlert,
  rejectBookingAlert,
  cancelBookingAlert,
  claimBookingAlert,
};