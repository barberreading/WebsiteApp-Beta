const express = require('express');
const router = express.Router();
const { healthCheck } = require('./health.controllers');

router.get('/', healthCheck);

module.exports = router;