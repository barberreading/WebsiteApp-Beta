const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateEmail,
  changePassword,
} = require('./auth.controllers');
const { protect } = require('../../middleware/auth');

router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('role', 'Role is required').isIn(['superuser', 'manager', 'staff', 'client']),
  ],
  register
);

router.post('/login', login);

router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:resetToken', resetPassword);

router.post('/update-email', protect, updateEmail);

router.post('/change-password', protect, changePassword);

module.exports = router;