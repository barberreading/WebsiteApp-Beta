const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');

/**
 * Registers a new user.
 * @param {object} userData - The user data.
 * @param {string} userData.name - The user's name.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @param {string} userData.role - The user's role.
 * @param {string} [userData.createdBy] - The ID of the user who created this user.
 * @returns {Promise<object>} An object containing the JWT token and a flag indicating if the password is temporary.
 * @throws {Error} If the user already exists.
 */
const register = async (userData) => {
  const { name, email, password, role, createdBy } = userData;

  let user = await User.findOne({ email });
  if (user) {
    throw new Error('User already exists');
  }

  user = new User({
    name,
    email,
    password,
    role,
    createdBy,
    consentGiven: true,
    consentDate: Date.now(),
    isTemporaryPassword: true,
  });

  await user.save();

  const token = user.getSignedJwtToken();

  return {
    token,
    isTemporaryPassword: user.isTemporaryPassword,
  };
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} An object containing the JWT token, a flag indicating if the password is temporary, and user information.
 * @throws {Error} If the credentials are invalid.
 */
const login = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = user.getSignedJwtToken();

  return {
    token,
    isTemporaryPassword: user.isTemporaryPassword,
  };
};

/**
 * Gets the currently logged-in user's data.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The user object.
 */
const getMe = async (userId) => {
  // Provide a mock user in development for testing purposes
  if (process.env.NODE_ENV === 'development' && userId === 'dev_user_id') {
    return {
      _id: 'dev_user_id',
      name: 'Development User',
      email: 'dev@example.com',
      role: 'superuser',
    };
  }
  return await User.findById(userId).select('-password');
};

/**
 * Generates a password reset token for a user.
 * @param {string} email - The user's email.
 * @returns {Promise<string>} The password reset token.
 * @throws {Error} If the user is not found.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Generate a random reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Set token and expiration on the user object
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  return resetToken;
};

/**
 * Resets a user's password using a reset token.
 * @param {string} resetToken - The password reset token.
 * @param {string} password - The new password.
 * @throws {Error} If the token is invalid or expired.
 */
const resetPassword = async (resetToken, password) => {
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  // Set new password and clear reset token fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.isTemporaryPassword = false;

  await user.save();
};

/**
 * Updates a user's email address.
 * @param {string} userId - The ID of the user.
 * @param {string} email - The new email address.
 * @param {string} password - The user's current password for verification.
 * @throws {Error} If the password is incorrect or the email is already in use.
 */
const updateEmail = async (userId, email, password) => {
  const user = await User.findById(userId).select('+password');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Password is incorrect');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.id !== userId) {
    throw new Error('Email already in use');
  }

  user.email = email;
  await user.save();
};

/**
 * Changes a user's password.
 * @param {string} userId - The ID of the user.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password.
 * @throws {Error} If the current password is incorrect.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  user.isTemporaryPassword = false;
  await user.save();
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateEmail,
  changePassword,
};