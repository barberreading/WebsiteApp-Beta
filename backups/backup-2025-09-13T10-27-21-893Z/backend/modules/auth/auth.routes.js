const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateEmail,
  changePassword,
} = require('./auth.controllers');
const { protect } = require('../../middleware/auth');
const {
  sanitizeBody,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange
} = require('../../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, sanitizeBody, validateUserRegistration, register);

router.post('/login', authLimiter, sanitizeBody, validateUserLogin, login);

router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.post('/forgot-password', passwordResetLimiter, forgotPassword);

router.post('/reset-password/:resetToken', passwordResetLimiter, resetPassword);

router.post('/update-email', protect, updateEmail);

router.post('/change-password', protect, sanitizeBody, validatePasswordChange, changePassword);

module.exports = router;