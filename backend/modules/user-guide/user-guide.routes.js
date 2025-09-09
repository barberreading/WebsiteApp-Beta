const express = require('express');
const router = express.Router();
const { protect: auth } = require('../../middleware/auth');
const { getUserGuide, updateUserGuide } = require('./user-guide.controllers');

// Get user guide content
router.get('/', auth, getUserGuide);

// Update user guide content
router.put('/', auth, updateUserGuide);

module.exports = router;