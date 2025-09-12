const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validation');
const { getReport } = require('./reports.controllers');

router.route('/:reportType').get(protect, authorize('manager', 'superuser'), validateObjectId('reportType'), getReport);

module.exports = router;