const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getHrDocumentAccess } = require('./hr-document-access.controllers');

router.get('/', protect, authorize('superuser', 'manager'), getHrDocumentAccess);

module.exports = router;