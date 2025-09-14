const crypto = require('crypto');
const User = require('../../models/User');
const emailService = require('../../utils/emailService');

const forgotPassword = async (email, protocol, host) => {
  const user = await User.findOne({ email });

  if (!user) {
    return { success: false, statusCode: 404, message: 'There is no user with that email' };
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${protocol}://${host}/reset-password/${resetToken}`;

  try {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Password reset token',
      text: `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`
    });

    return { success: true, data: 'Email sent' };
  } catch (err) {
    logger.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return { success: false, statusCode: 500, message: 'Email could not be sent' };
  }
};

const resetPassword = async (token, password) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return { success: false, statusCode: 400, message: 'Invalid token' };
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { success: true, data: 'Password reset successful' };
};

module.exports = {
  forgotPassword,
  resetPassword,
};