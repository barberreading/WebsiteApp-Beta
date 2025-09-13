const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    sanitizeBody,
    validateUserRegistration,
    validateObjectId,
    validatePagination,
    validatePasswordChange
} = require('../../middleware/validation');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const { getProfile, getStaff, updateProfile, uploadPhoto, getUsers, getUserById, createUser, updateUser, updateUserDocuments, deleteUser, changePassword } = require('./users.controllers');

router.route('/').get(protect, authorize('superuser', 'manager'), validatePagination, getUsers).post(protect, authorize('superuser', 'manager'), createModifyLimiter, sanitizeBody, validateUserRegistration, createUser);
router.route('/profile').get(protect, getProfile).put(protect, createModifyLimiter, sanitizeBody, updateProfile);
router.route('/staff').get(protect, getStaff);
router.put('/change-password', protect, sanitizeBody, validatePasswordChange, changePassword);
router.route('/:id')
    .get(protect, authorize('superuser', 'manager'), validateObjectId('id'), getUserById)
    .put(protect, authorize('superuser', 'manager'), createModifyLimiter, validateObjectId('id'), sanitizeBody, validateUserRegistration, updateUser)
    .delete(protect, authorize('superuser'), createModifyLimiter, validateObjectId('id'), deleteUser);
router.put('/:id/document-sharing', protect, authorize('superuser', 'manager'), createModifyLimiter, validateObjectId('id'), sanitizeBody, updateUserDocuments);
router.route('/:id/photo').put(protect, authorize('superuser', 'manager'), validateObjectId('id'), uploadPhoto);


module.exports = router;