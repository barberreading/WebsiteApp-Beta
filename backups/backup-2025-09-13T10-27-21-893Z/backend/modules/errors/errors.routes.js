const express = require('express');
const router = express.Router();
const { protect: auth } = require('../../middleware/auth');
const { logFrontendError, getErrors, resolveError } = require('./errors.controllers');

router.post('/log', logFrontendError);
router.get('/', auth, getErrors);
router.put('/:id/resolve', auth, resolveError);

module.exports = router;