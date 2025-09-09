const User = require('../../models/User');
const Booking = require('../../models/Booking');
const LeaveRequest = require('../../models/LeaveRequest');

const getAvailableStaff = async (startTime, endTime) => {
  const bookingStartTime = new Date(startTime);
  const bookingEndTime = new Date(endTime);

  // Find all staff users
  const allStaff = await User.find({ role: 'staff' }).select('_id name');

  // Find bookings that overlap with the requested time slot
  const overlappingBookings = await Booking.find({
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $gte: bookingStartTime, $lt: bookingEndTime } },
      { endTime: { $gt: bookingStartTime, $lte: bookingEndTime } },
      { startTime: { $lte: bookingStartTime }, endTime: { $gte: bookingEndTime } }
    ]
  }).select('staff');

  // Find approved leave requests that overlap with the requested time slot
  const overlappingLeave = await LeaveRequest.find({
      status: 'approved',
      $or: [
          { startDate: { $gte: bookingStartTime, $lt: bookingEndTime } },
          { endDate: { $gt: bookingStartTime, $lte: bookingEndTime } },
          { startDate: { $lte: bookingStartTime }, endDate: { $gte: bookingEndTime } }
      ]
  }).select('staff');

  // Get IDs of staff who are already booked or on leave
  const unavailableStaffIdsFromBookings = overlappingBookings.map(booking => booking.staff.toString());
  const unavailableStaffIdsFromLeave = overlappingLeave.map(leave => leave.staff.toString());
  const unavailableStaffIds = [...new Set([...unavailableStaffIdsFromBookings, ...unavailableStaffIdsFromLeave])];

  // Filter out unavailable staff
  const availableStaff = allStaff.filter(staff => !unavailableStaffIds.includes(staff._id.toString()));

  return availableStaff;
};

module.exports = {
  getAvailableStaff,
};