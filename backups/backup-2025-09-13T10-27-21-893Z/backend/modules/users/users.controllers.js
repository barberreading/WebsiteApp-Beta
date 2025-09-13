const path = require('path');
const userService = require('./users.services');
const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * @description Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res, next) => {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
});

/**
 * @description Get all staff members
 * @route GET /api/users/staff
 * @access Private
 */
const getStaff = asyncHandler(async (req, res, next) => {
    console.log('🔧 GET /api/users/staff - User requesting:', {
        id: req.user?.id,
        name: req.user?.name,
        email: req.user?.email,
        role: req.user?.role
    });
    
    const staffMembers = await userService.getStaff(req.user);
    
    console.log('🔧 Staff members found:', staffMembers.length);
    console.log('🔧 Staff members details:', staffMembers.map(user => ({ 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        active: user.active 
    })));
    
    console.log('🔧 Sending response with', staffMembers.length, 'staff members');
    res.json(staffMembers);
});

/**
 * @description Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res, next) => {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
});

/**
 * @description Get all users
 * @route GET /api/users
 * @access Private (superuser, manager)
 */
const getUsers = asyncHandler(async (req, res, next) => {
    const users = await userService.getUsers(req.query, req.user);
    res.json(users);
});

/**
 * @description Get user by ID
 * @route GET /api/users/:id
 * @access Private (superuser, manager)
 */
const getUserById = asyncHandler(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.json(user);
});

/**
 * @description Create a new user
 * @route POST /api/users
 * @access Private (superuser, manager)
 */
const createUser = asyncHandler(async (req, res, next) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
});

/**
 * @description Update a user
 * @route PUT /api/users/:id
 * @access Private (superuser, manager)
 */
const updateUser = asyncHandler(async (req, res, next) => {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.json(user);
});

/**
 * @description Update user documents
 * @route PUT /api/users/:id/document-sharing
 * @access Private (superuser, manager)
 */
const updateUserDocuments = asyncHandler(async (req, res, next) => {
    const user = await userService.updateUserDocuments(req.params.id, req.body);
    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.json(user);
});

/**
 * @description Delete a user
 * @route DELETE /api/users/:id
 * @access Private (superuser)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await userService.deleteUser(req.params.id);
    if (!user) {
        return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.json({ msg: 'User removed' });
});

/**
 * @description Change user password
 * @route PUT /api/users/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
    await userService.changePassword(req.user.id, req.body.password);
    res.json({ msg: 'Password changed successfully' });
});

/**
 * @description Upload user photo
 * @route PUT /api/users/:id/photo
 * @access Private (superuser, manager)
 */
const uploadPhoto = asyncHandler(async (req, res, next) => {
    const fileName = await userService.uploadPhoto(req.params.id, req.files.file);
    res.status(200).json({
        success: true,
        data: fileName,
    });
});

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