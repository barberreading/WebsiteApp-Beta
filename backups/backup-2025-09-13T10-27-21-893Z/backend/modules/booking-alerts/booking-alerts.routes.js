const express = require('express');
const {
  getBookingAlerts,
  getAvailableBookingAlerts,
  getBookingAlert,
  createBookingAlert,
  confirmBookingAlert,
  rejectBookingAlert,
  cancelBookingAlert,
  claimBookingAlert,
} = require('./booking-alerts.controllers');

const BookingAlert = require('../../models/BookingAlert');
const advancedResults = require('../../middleware/advancedResults');
const { protect, authorize } = require('../../middleware/auth');
const {
    sanitizeBody,
    validateBookingAlert,
    validateObjectId
} = require('../../middleware/validation');

const router = express.Router();

router
  .route('/')
  .get(
    protect,
    authorize('admin', 'superuser', 'manager'),
    advancedResults(BookingAlert, [
      { path: 'service', select: 'name' },
      { path: 'location', select: 'name address' },
      { path: 'claimedBy', select: 'name' },
    ]),
    getBookingAlerts
  )
  .post(protect, authorize('admin', 'superuser', 'manager'), sanitizeBody, validateBookingAlert, createBookingAlert);

router
  .route('/available')
  .get(protect, authorize('staff'), getAvailableBookingAlerts);

router
  .route('/:id')
  .get(protect, validateObjectId('id'), getBookingAlert)
  .put(protect, authorize('admin', 'superuser', 'manager'), validateObjectId('id'), cancelBookingAlert);

router
  .route('/:id/confirm')
  .put(protect, authorize('manager', 'superuser', 'admin'), validateObjectId('id'), confirmBookingAlert);

router
  .route('/:id/reject')
  .put(protect, authorize('manager', 'superuser', 'admin'), validateObjectId('id'), rejectBookingAlert);

router.route('/:id/claim').put(protect, authorize('staff'), validateObjectId('id'), claimBookingAlert);

module.exports = router;