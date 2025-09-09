const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getReport } = require('./reports.controllers');

router.route('/:reportType').get(protect, authorize('manager', 'superuser'), getReport);

module.exports = router;