const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { uploadPhoto } = require('./image-upload.controllers');

router.route('/').post(protect, uploadPhoto);

module.exports = router;