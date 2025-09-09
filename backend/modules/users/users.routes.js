const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { getProfile, getStaff, updateProfile, uploadPhoto, getUsers, getUserById, createUser, updateUser, updateUserDocuments, deleteUser, changePassword } = require('./users.controllers');

router.route('/').get(protect, authorize('superuser', 'manager'), getUsers).post(protect, authorize('superuser', 'manager'), createUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/staff').get(protect, getStaff);
router.put('/change-password', protect, changePassword);
router.route('/:id').get(protect, authorize('superuser', 'manager'), getUserById).put(protect, authorize('superuser', 'manager'), updateUser).delete(protect, authorize('superuser'), deleteUser);
router.put('/:id/document-sharing', protect, authorize('superuser', 'manager'), updateUserDocuments);
router.route('/:id/photo').put(protect, authorize('superuser', 'manager'), uploadPhoto);


module.exports = router;