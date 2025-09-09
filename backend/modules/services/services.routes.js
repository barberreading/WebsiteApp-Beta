const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { getServices, getPredefinedColors, getServiceById, createService, updateService, deleteService } = require('./services.controllers');

router.get('/', protect, getServices);
router.get('/colors/predefined', protect, getPredefinedColors);
router.get('/:id', protect, getServiceById);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;