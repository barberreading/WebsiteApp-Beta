const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getAvailableStaff } = require('./available-staff.controllers');

router.route('/').get(protect, authorize('manager', 'superuser', 'admin'), getAvailableStaff);

module.exports = router;