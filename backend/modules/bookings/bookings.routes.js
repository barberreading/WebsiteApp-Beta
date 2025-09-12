const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    sanitizeBody,
    validateBooking,
    validateObjectId,
    validatePagination
} = require('../../middleware/validation');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const { 
    getBookings, 
    getBookingActivity, 
    getBookingsByRange, 
    getWeeklyBookings, 
    getBookingById, 
    createBooking, 
    updateBooking, 
    deleteBooking 
} = require('./bookings.controllers');

// More specific routes should come before dynamic routes

// GET /api/bookings/range
router.route('/range').get(protect, validatePagination, getBookingsByRange);

// GET /api/bookings/weekly
router.route('/weekly').get(protect, getWeeklyBookings);

// GET /api/bookings/activity
router.route('/activity').get(protect, authorize('admin', 'superuser', 'manager'), getBookingActivity);

// GET /api/bookings/ and POST /api/bookings/
router.route('/').get(protect, validatePagination, getBookings).post(protect, createModifyLimiter, sanitizeBody, validateBooking, createBooking);

// GET /api/bookings/:id, PUT /api/bookings/:id, DELETE /api/bookings/:id
router.route('/:id')
    .get(protect, validateObjectId('id'), getBookingById)
    .put(protect, createModifyLimiter, sanitizeBody, validateBooking, updateBooking)
    .delete(protect, createModifyLimiter, validateObjectId('id'), deleteBooking);

module.exports = router;