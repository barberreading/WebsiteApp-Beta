const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  resetPassword
} = require('./password-reset.controllers');

router.post('/forgot', forgotPassword);
router.put('/:resettoken', resetPassword);

module.exports = router;