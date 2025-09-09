const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { getStats } = require('./dashboard.controllers');

router.get('/stats', protect, getStats);

module.exports = router;