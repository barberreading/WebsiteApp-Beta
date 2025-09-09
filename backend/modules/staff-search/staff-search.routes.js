const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const staffSearchController = require('./staff-search.controllers');

router.get('/by-distance', protect, authorize('manager', 'superuser', 'admin'), staffSearchController.searchStaffByDistance);
router.put('/update-location', protect, staffSearchController.updateStaffLocation);

module.exports = router;