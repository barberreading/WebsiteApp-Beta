const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
    sanitizeBody,
    validateClient,
    validateObjectId,
    validatePagination
} = require('../../middleware/validation');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('./clients.controllers');

router.route('/').get(protect, validatePagination, getClients).post(protect, createModifyLimiter, sanitizeBody, validateClient, createClient);
router.route('/:id')
    .get(protect, validateObjectId('id'), getClientById)
    .put(protect, createModifyLimiter, sanitizeBody, validateClient, updateClient)
    .delete(protect, createModifyLimiter, validateObjectId('id'), deleteClient);

module.exports = router;