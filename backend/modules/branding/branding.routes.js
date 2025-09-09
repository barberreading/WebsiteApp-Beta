const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getBranding, updateBranding, uploadLogo } = require('./branding.controllers');

router.route('/')
  .get(getBranding)
  .put(protect, authorize('superuser', 'manager'), updateBranding);

router.route('/upload-logo').post(protect, authorize('superuser', 'manager'), uploadLogo);

module.exports = router;