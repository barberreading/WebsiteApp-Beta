const User = require('../../models/User');
// const { sendNewUserEmail } = require('../email/email.services'); // Removed due to circular dependency
const path = require('path');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * @description Get user profile
 * @param {string} userId - The ID of the user
 * @returns {Promise<User>}
 */
const getProfile = async (userId) => {
    return await User.findById(userId).select('-password');
};

/**
 * @description Get all staff members
 * @returns {Promise<User[]>}
 */
const getStaff = async () => {
    return await User.find({
        role: { $in: ['staff', 'manager', 'superuser'] }
    }).select('-password').populate('locationArea', 'name');
};

/**
 * @description Update user profile
 * @param {string} userId - The ID of the user
 * @param {object} profileData - The user's profile data
 * @returns {Promise<User>}
 */
const updateProfile = async (userId, profileData) => {
    return await User.findByIdAndUpdate(userId, { $set: profileData }, { new: true });
};

/**
 * @description Get all users
 * @returns {Promise<User[]>}
 */
const getUsers = async (query) => {
    return await User.find(query).select('-password');
};

/**
 * @description Get user by ID
 * @param {string} userId - The ID of the user
 * @returns {Promise<User>}
 */
const getUserById = async (userId) => {
    return await User.findById(userId).select('-password');
};

/**
 * @description Create a new user
 * @param {object} userData - The user's data
 * @returns {Promise<User>}
 */
const createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    // TODO: Re-implement sendNewUserEmail without circular dependency
    // await sendNewUserEmail(user, userData.password);
    return user;
};

/**
 * @description Update a user
 * @param {string} userId - The ID of the user
 * @param {object} userData - The user's data
 * @returns {Promise<User>}
 */
const updateUser = async (userId, userData) => {
    return await User.findByIdAndUpdate(userId, { $set: userData }, { new: true });
};

/**
 * @description Update user documents
 * @param {string} userId - The ID of the user
 * @param {object} documentData - The user's document data
 * @returns {Promise<User>}
 */
const updateUserDocuments = async (userId, documentData) => {
    return await User.findByIdAndUpdate(userId, { $set: documentData }, { new: true });
};

/**
 * @description Delete a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<User>}
 */
const deleteUser = async (userId) => {
    return await User.findByIdAndRemove(userId);
};

/**
 * @description Change user password
 * @param {string} userId - The ID of the user
 * @param {string} newPassword - The new password
 * @returns {Promise<void>}
 */
const changePassword = async (userId, newPassword) => {
    const user = await User.findById(userId);
    user.password = newPassword;
    await user.save();
};

/**
 * @description Upload user photo
 * @param {string} userId - The ID of the user
 * @param {object} file - The file to upload
 * @returns {Promise<string>}
 * @throws {ErrorResponse}
 */
const uploadPhoto = async (userId, file) => {
    if (!file) {
        throw new ErrorResponse('Please upload a file', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ErrorResponse(`User not found with id of ${userId}`, 404);
    }

    if (!file.mimetype.startsWith('image')) {
        throw new ErrorResponse('Please upload an image file', 400);
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
        throw new ErrorResponse(
            `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
            400
        );
    }

    file.name = `photo_${user._id}${path.parse(file.name).ext}`;

    await new Promise((resolve, reject) => {
        file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
            if (err) {
                console.error(err);
                return reject(new ErrorResponse('Problem with file upload', 500));
            }
            await User.findByIdAndUpdate(userId, { photo: file.name });
            resolve();
        });
    });
    return file.name;
};

module.exports = {
    getProfile,
    getStaff,
    updateProfile,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserDocuments,
    deleteUser,
    changePassword,
    uploadPhoto,
};