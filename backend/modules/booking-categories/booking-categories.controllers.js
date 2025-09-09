const asyncHandler = require('../../middleware/async');
const bookingCategoriesService = require('./booking-categories.services');

// @desc    Get all booking keys
// @route   GET /api/booking-categories/keys
// @access  Private
exports.getBookingKeys = asyncHandler(async (req, res) => {
  const bookingKeys = await bookingCategoriesService.getBookingKeys();
  res.status(200).json({
    success: true,
    count: bookingKeys.length,
    data: bookingKeys
  });
});

// @desc    Create new booking key
// @route   POST /api/booking-categories/keys
// @access  Private (Admin and Superuser)
exports.createBookingKey = asyncHandler(async (req, res) => {
  const bookingKey = await bookingCategoriesService.createBookingKey(req.body);
  res.status(201).json({
    success: true,
    data: bookingKey
  });
});

// @desc    Update booking key
// @route   PUT /api/booking-categories/keys/:id
// @access  Private (Superuser only)
exports.updateBookingKey = asyncHandler(async (req, res) => {
  const bookingKey = await bookingCategoriesService.updateBookingKey(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: bookingKey
  });
});

// @desc    Delete booking key
// @route   DELETE /api/booking-categories/keys/:id
// @access  Private (Admin and Superuser)
exports.deleteBookingKey = asyncHandler(async (req, res) => {
  await bookingCategoriesService.deleteBookingKey(req.params.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all location areas
// @route   GET /api/booking-categories/areas
// @access  Private
exports.getLocationAreas = asyncHandler(async (req, res) => {
  const locationAreas = await bookingCategoriesService.getLocationAreas();
  res.status(200).json({
    success: true,
    count: locationAreas.length,
    data: locationAreas
  });
});

// @desc    Create new location area
// @route   POST /api/booking-categories/areas
// @access  Private (Admin and Superuser)
exports.createLocationArea = asyncHandler(async (req, res) => {
  const locationArea = await bookingCategoriesService.createLocationArea(req.body);
  res.status(201).json({
    success: true,
    data: locationArea
  });
});

// @desc    Update location area
// @route   PUT /api/booking-categories/areas/:id
// @access  Private (Admin and Superuser)
exports.updateLocationArea = asyncHandler(async (req, res) => {
  const locationArea = await bookingCategoriesService.updateLocationArea(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: locationArea
  });
});

// @desc    Delete location area
// @route   DELETE /api/booking-categories/areas/:id
// @access  Private (Admin and Superuser)
exports.deleteLocationArea = asyncHandler(async (req, res) => {
  await bookingCategoriesService.deleteLocationArea(req.params.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});