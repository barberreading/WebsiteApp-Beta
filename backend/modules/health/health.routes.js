const express = require('express');
const router = express.Router();
const { healthCheck, detailedHealthCheck } = require('./health.controllers');

router.get('/', healthCheck);
router.get('/detailed', detailedHealthCheck);

module.exports = router;