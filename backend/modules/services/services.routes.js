const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const { getServices, getPredefinedColors, getServiceById, createService, updateService, deleteService } = require('./services.controllers');

router.get('/', protect, getServices);
router.get('/colors/predefined', protect, getPredefinedColors);
router.get('/:id', protect, getServiceById);
router.post('/', protect, createModifyLimiter, createService);
router.put('/:id', protect, createModifyLimiter, updateService);
router.delete('/:id', protect, createModifyLimiter, deleteService);

module.exports = router;