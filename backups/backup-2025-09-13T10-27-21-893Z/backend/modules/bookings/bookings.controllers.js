const asyncHandler = require('../../middleware/async');
const bookingService = require('./bookings.services');

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getBookings(req.user);
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const getBookingActivity = asyncHandler(async (req, res) => {
  const { activities, pagination } = await bookingService.getBookingActivity(req.query);
  res.status(200).json({ success: true, pagination, data: activities });
});

const getBookingsByRange = asyncHandler(async (req, res) => {
  const { bookings, pagination } = await bookingService.getBookingsByRange(req.query, req.user);
  res.status(200).json({ success: true, count: bookings.length, pagination, data: bookings });
});

const getWeeklyBookings = asyncHandler(async (req, res) => {
  const weeklyBookings = await bookingService.getWeeklyBookings(req.query.startDate, req.query.endDate, req.user);
  res.status(200).json({ success: true, data: weeklyBookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  res.status(200).json({ success: true, data: booking });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body, req.user);
  res.status(201).json({ success: true, data: booking });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBooking(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: booking });
});

const deleteBooking = asyncHandler(async (req, res) => {
  await bookingService.deleteBooking(req.params.id, req.user);
  res.status(200).json({ success: true, data: {} });
});

const getBookedStaffForClient = asyncHandler(async (req, res) => {
  const bookedStaff = await bookingService.getBookedStaffForClient(req.params.clientId, req.user);
  res.status(200).json({ success: true, count: bookedStaff.length, data: bookedStaff });
});

const getBookingsForClientAndStaff = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getBookingsForClientAndStaff(req.params.clientId, req.params.staffId, req.user);
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

module.exports = {
  getBookings,
  getBookingActivity,
  getBookingsByRange,
  getWeeklyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookedStaffForClient,
  getBookingsForClientAndStaff
};