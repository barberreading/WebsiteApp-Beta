const asyncHandler = require('../../middleware/async');
const bookingAlertService = require('./booking-alerts.services');

// @desc    Get all booking alerts
// @route   GET /api/booking-alerts
// @access  Private (Admin, Superuser, Manager)
exports.getBookingAlerts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get available booking alerts for staff
// @route   GET /api/booking-alerts/available
// @access  Private (Staff)
exports.getAvailableBookingAlerts = asyncHandler(async (req, res, next) => {
  const alerts = await bookingAlertService.getAvailableBookingAlerts(req.user.id);
  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts,
  });
});

// @desc    Get single booking alert
// @route   GET /api/booking-alerts/:id
// @access  Private
exports.getBookingAlert = asyncHandler(async (req, res, next) => {
  const alert = await bookingAlertService.getBookingAlert(req.params.id);
  res.status(200).json({ success: true, data: alert });
});

// @desc    Create new booking alert
// @route   POST /api/booking-alerts
// @access  Private (Admin, Superuser, Manager)
exports.createBookingAlert = asyncHandler(async (req, res, next) => {
  const createdAlerts = await bookingAlertService.createBookingAlert(req.body, req.user);
  res.status(201).json({
    success: true,
    data: createdAlerts,
    count: createdAlerts.length,
  });
});

// @desc    Confirm a claimed booking alert (converts to booking)
// @route   PUT /api/booking-alerts/:id/confirm
// @access  Private (Managers, Superusers, Admins)
exports.confirmBookingAlert = asyncHandler(async (req, res, next) => {
  const newBooking = await bookingAlertService.confirmBookingAlert(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Alert confirmed and booking created.',
    data: newBooking,
  });
});

// @desc    Manager reject booking alert claim
// @route   PUT /api/booking-alerts/:id/reject
// @access  Private (Managers, Superusers, Admins)
exports.rejectBookingAlert = asyncHandler(async (req, res, next) => {
  const updatedAlert = await bookingAlertService.rejectBookingAlert(req.params.id, req.body.reason);
  res.status(200).json({
    success: true,
    message: 'Alert rejected and has been made available again.',
    data: updatedAlert,
  });
});

// @desc    Cancel a booking alert
// @route   PUT /api/booking-alerts/:id/cancel
// @access  Private (Managers only)
exports.cancelBookingAlert = asyncHandler(async (req, res, next) => {
  const bookingAlert = await bookingAlertService.cancelBookingAlert(req.params.id);
  res.status(200).json({
    success: true,
    data: bookingAlert,
  });
});

// @desc    Staff claim booking alert
// @route   PUT /api/booking-alerts/:id/claim
// @access  Private (Staff only)
exports.claimBookingAlert = asyncHandler(async (req, res, next) => {
  const alert = await bookingAlertService.claimBookingAlert(req.params.id, req.user);
  res.json({ 
    success: true,
    message: 'Alert claimed successfully. Awaiting manager confirmation.',
    data: alert
  });
});