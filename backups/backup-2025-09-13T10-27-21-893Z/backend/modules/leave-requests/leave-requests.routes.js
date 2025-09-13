const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { createModifyLimiter } = require('../../middleware/rateLimiter');
const {
  getLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  denyLeaveRequest,
  withdrawLeaveRequest
} = require('./leave-requests.controllers');

router.route('/')
  .get(protect, getLeaveRequests)
  .post(protect, authorize('staff'), createModifyLimiter, createLeaveRequest);

router.route('/:id')
  .get(protect, getLeaveRequest);

router.route('/:id/approve')
  .put(protect, authorize('manager', 'superuser'), createModifyLimiter, approveLeaveRequest);

router.route('/:id/deny')
  .put(protect, authorize('manager', 'superuser'), createModifyLimiter, denyLeaveRequest);

router.route('/:id/withdraw')
  .put(protect, authorize('staff'), createModifyLimiter, withdrawLeaveRequest);

module.exports = router;