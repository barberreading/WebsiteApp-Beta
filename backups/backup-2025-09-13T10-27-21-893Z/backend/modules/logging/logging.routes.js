const express = require('express');
const router = express.Router();
const {
  checkLogs,
  clearLogs,
  truncateLog,
  clearSpecificLog
} = require('./logging.controllers');
const { protect, admin } = require('../../middleware/auth');

router.post('/check', protect, admin, checkLogs);
router.post('/clear', protect, admin, clearLogs);
router.post('/truncate/:logPath', protect, admin, truncateLog);
router.post('/clear/:logPath', protect, admin, clearSpecificLog);

module.exports = router;