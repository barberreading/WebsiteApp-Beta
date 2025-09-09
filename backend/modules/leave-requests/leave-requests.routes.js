const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
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
  .post(protect, authorize('staff'), createLeaveRequest);

router.route('/:id')
  .get(protect, getLeaveRequest);

router.route('/:id/approve')
  .put(protect, authorize('manager', 'superuser'), approveLeaveRequest);

router.route('/:id/deny')
  .put(protect, authorize('manager', 'superuser'), denyLeaveRequest);

router.route('/:id/withdraw')
  .put(protect, authorize('staff'), withdrawLeaveRequest);

module.exports = router;