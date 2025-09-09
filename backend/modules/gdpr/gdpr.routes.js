const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { getMyData, updateConsent, deleteMyData, getRequests, submitDataRequest, submitDeletionRequest, processRequest } = require('./gdpr.controllers');

/**
 * @description GDPR routes
 * @route /api/v1/gdpr
 */
router.get('/my-data', protect, getMyData);
router.post('/consent', protect, updateConsent);
router.delete('/delete-my-data', protect, deleteMyData);
router.get('/requests', protect, getRequests);
router.post('/data-request', protect, submitDataRequest);
router.post('/deletion-request', protect, submitDeletionRequest);
router.put('/requests/:id', protect, processRequest);

module.exports = router;