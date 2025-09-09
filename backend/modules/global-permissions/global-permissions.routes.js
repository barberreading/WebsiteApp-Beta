const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getGlobalPermissions, updateGlobalPermissions, getRolePermissions, getClientTemplate, resetPermissions } = require('./global-permissions.controllers');

router.get('/', protect, authorize('superuser', 'manager'), getGlobalPermissions);
router.put('/', protect, authorize('superuser'), updateGlobalPermissions);
router.get('/role/:role', protect, getRolePermissions);
router.get('/client-template', protect, authorize('superuser', 'manager'), getClientTemplate);
router.post('/reset', protect, authorize('superuser'), resetPermissions);

module.exports = router;