const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('./clients.controllers');

router.route('/').get(protect, getClients).post(protect, createClient);
router.route('/:id').get(protect, getClientById).put(protect, updateClient).delete(protect, deleteClient);

module.exports = router;