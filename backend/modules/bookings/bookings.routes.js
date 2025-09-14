const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    sanitizeBody,
    validateBooking,
    validateBookingUpdate,
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
    deleteBooking,
    getBookedStaffForClient,
    getBookingsForClientAndStaff,
    syncOfflineBookings 
} = require('./bookings.controllers');

// More specific routes should come before dynamic routes

// GET /api/bookings/range
router.route('/range').get(protect, validatePagination, getBookingsByRange);

// GET /api/bookings/weekly
router.route('/weekly').get(protect, getWeeklyBookings);

// GET /api/bookings/activity
router.route('/activity').get(protect, authorize('admin', 'superuser', 'manager'), getBookingActivity);

// POST /api/bookings/sync-offline - Sync offline booking queue
router.route('/sync-offline').post(protect, syncOfflineBookings);

// GET /api/bookings/client/:clientId/booked-staff
router.route('/client/:clientId/booked-staff').get(protect, authorize('client'), getBookedStaffForClient);

// GET /api/bookings/client/:clientId/staff/:staffId
router.route('/client/:clientId/staff/:staffId').get(protect, authorize('client'), getBookingsForClientAndStaff);

// GET /api/bookings/ and POST /api/bookings/
router.route('/').get(protect, validatePagination, getBookings).post(protect, createModifyLimiter, sanitizeBody, validateBooking, createBooking);

// GET /api/bookings/:id, PUT /api/bookings/:id, DELETE /api/bookings/:id
router.route('/:id')
    .get(protect, validateObjectId('id'), getBookingById)
    .put(protect, createModifyLimiter, sanitizeBody, validateBookingUpdate, updateBooking)
    .delete(protect, createModifyLimiter, validateObjectId('id'), deleteBooking);

module.exports = router;