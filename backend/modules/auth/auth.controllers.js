const { validationResult } = require('express-validator');
const authService = require('./auth.services');
const asyncHandler = require('../../middleware/async.js');
const logger = require('../../utils/logger');

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const result = await authService.register(req.body);
  res.json(result);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe = false } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const result = await authService.login(email, password, rememberMe);
  res.json(result);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await authService.getMe(req.user.id);
  res.json(user);
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  const result = await authService.logout(token, req.user.id);
  res.json(result);
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const resetToken = await authService.forgotPassword(email);
  res.json({
    success: true,
    msg: 'Password reset token generated',
    resetToken,
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  await authService.resetPassword(req.params.resetToken, password);
  res.json({ success: true, msg: 'Password reset successful' });
});

/**
 * @desc    Update email
 * @route   POST /api/v1/auth/update-email
 * @access  Private
 */
const updateEmail = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  await authService.updateEmail(req.user.id, email, password);
  res.json({ success: true, msg: 'Email updated successfully' });
});

/**
 * @desc    Change password
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword, token);
  res.json(result);
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateEmail,
  changePassword,
};