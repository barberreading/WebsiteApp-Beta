const express = require('express');
const router = express.Router();
const {
  getOutlookCalendarLink,
  getICalFile
} = require('./calendar-integration.controllers');

router.post('/outlook', getOutlookCalendarLink);
router.post('/ical', getICalFile);

module.exports = router;