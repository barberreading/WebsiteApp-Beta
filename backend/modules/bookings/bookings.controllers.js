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

const syncOfflineBookings = asyncHandler(async (req, res) => {
  const { bookings } = req.body;
  
  if (!bookings || !Array.isArray(bookings)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request: bookings array is required' 
    });
  }

  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };

  for (const bookingData of bookings) {
    try {
      // Check for duplicates based on offline ID or booking details
      if (bookingData.offlineId) {
        const existingBooking = await bookingService.findBookingByOfflineId(bookingData.offlineId);
        if (existingBooking) {
          results.duplicates.push({
            offlineId: bookingData.offlineId,
            existingId: existingBooking._id,
            reason: 'Booking already exists'
          });
          continue;
        }
      }

      // Create the booking
      const booking = await bookingService.createBooking(bookingData, req.user);
      results.successful.push({
        offlineId: bookingData.offlineId,
        bookingId: booking._id,
        booking: booking
      });
    } catch (error) {
      results.failed.push({
        offlineId: bookingData.offlineId,
        error: error.message,
        bookingData: bookingData
      });
    }
  }

  res.status(200).json({ 
    success: true, 
    data: results,
    summary: {
      total: bookings.length,
      successful: results.successful.length,
      failed: results.failed.length,
      duplicates: results.duplicates.length
    }
  });
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
  getBookingsForClientAndStaff,
  syncOfflineBookings
};