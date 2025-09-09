const express = require('express');
const {
  getErrorLogs,
  resolveErrorLog
} = require('./error-logging.controllers');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin'), getErrorLogs);

router
  .route('/:id/resolve')
  .put(protect, authorize('admin'), resolveErrorLog);

module.exports = router;