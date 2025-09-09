const asyncHandler = require('../../middleware/async');
const passwordResetService = require('./password-reset.services');

// @desc    Forgot password
// @route   POST /api/password-reset/forgot
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const result = await passwordResetService.forgotPassword(req.body.email, req.protocol, req.get('host'));

  if (!result.success) {
    return res.status(result.statusCode || 500).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, data: result.data });
});

// @desc    Reset password
// @route   PUT /api/password-reset/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const result = await passwordResetService.resetPassword(req.params.resettoken, req.body.password);

  if (!result.success) {
    return res.status(result.statusCode || 400).json({ success: false, message: result.message });
  }

  res.status(200).json({ success: true, data: result.data });
});

module.exports = {
  forgotPassword,
  resetPassword,
};