const express = require('express');
const {
  getBookingKeys,
  createBookingKey,
  updateBookingKey,
  deleteBookingKey,
  getLocationAreas,
  createLocationArea,
  updateLocationArea,
  deleteLocationArea
} = require('./booking-categories.controllers');
const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

router.route('/keys')
  .get(protect, getBookingKeys)
  .post(protect, authorize('admin', 'superuser'), createBookingKey);

router.route('/keys/:id')
  .put(protect, authorize('superuser'), updateBookingKey)
  .delete(protect, authorize('admin', 'superuser'), deleteBookingKey);

router.route('/areas')
  .get(protect, getLocationAreas)
  .post(protect, authorize('admin', 'superuser'), createLocationArea);

router.route('/areas/:id')
  .put(protect, authorize('admin', 'superuser'), updateLocationArea)
  .delete(protect, authorize('admin', 'superuser'), deleteLocationArea);

module.exports = router;