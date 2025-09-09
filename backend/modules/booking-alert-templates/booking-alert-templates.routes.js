const express = require('express');
const {
  getBookingAlertTemplates,
  getBookingAlertTemplate,
  createBookingAlertTemplate,
  updateBookingAlertTemplate,
  deleteBookingAlertTemplate,
  createBookingAlertFromTemplate,
} = require('./booking-alert-templates.controllers');

const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('manager', 'superuser', 'admin'), getBookingAlertTemplates)
  .post(protect, authorize('manager', 'superuser', 'admin'), createBookingAlertTemplate);

router
  .route('/:id')
  .get(protect, authorize('manager', 'superuser', 'admin'), getBookingAlertTemplate)
  .put(protect, authorize('manager', 'superuser', 'admin'), updateBookingAlertTemplate)
  .delete(protect, authorize('manager', 'superuser', 'admin'), deleteBookingAlertTemplate);

router
  .route('/:id/create-alert')
  .post(protect, authorize('manager', 'superuser', 'admin'), createBookingAlertFromTemplate);

module.exports = router;