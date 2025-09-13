const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const { getMyData, updateConsent, deleteMyData, getRequests, submitDataRequest, submitDeletionRequest, processRequest } = require('./gdpr.controllers');

/**
 * @description GDPR routes
 * @route /api/v1/gdpr
 */
router.get('/my-data', protect, getMyData);
router.post('/consent', protect, createModifyLimiter, updateConsent);
router.delete('/delete-my-data', protect, createModifyLimiter, deleteMyData);
router.get('/requests', protect, getRequests);
router.post('/data-request', protect, createModifyLimiter, submitDataRequest);
router.post('/deletion-request', protect, createModifyLimiter, submitDeletionRequest);
router.put('/requests/:id', protect, createModifyLimiter, processRequest);

module.exports = router;