const express = require('express');
const { getAuditTrail } = require('./audit-trail.controllers');
const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

router.route('/').get(protect, authorize('admin'), getAuditTrail);

module.exports = router;