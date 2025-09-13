const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { getNotifications } = require('./timesheet-notifications.controllers');

router.get('/', auth.protect, getNotifications);

module.exports = router;