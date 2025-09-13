const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { 
  updateTimesheet, 
  checkTimesheetLock, 
  clockIn, 
  clockOut, 
  getCurrentStatus, 
  bulkUpload, 
  getLockSettings, 
  updateLockSettings, 
  overrideTimesheet,
  getClientApprovalTimesheets,
  clientApproveTimesheet
} = require('./timesheets.controllers');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.put('/:id', protect, checkTimesheetLock, updateTimesheet);
router.post('/clock-in', protect, clockIn);

module.exports = router;
router.post('/clock-out', protect, clockOut);
router.get('/current-status', protect, getCurrentStatus);
router.post('/bulk-upload', protect, authorize('manager', 'admin', 'superuser'), upload.array('timesheets'), bulkUpload);
router.get('/lock-settings', protect, authorize('manager', 'admin', 'superuser'), getLockSettings);
router.put('/lock-settings', protect, authorize('superuser'), updateLockSettings);
router.put('/:id/override', protect, authorize('manager', 'admin', 'superuser'), overrideTimesheet);
router.get('/client-approval', protect, authorize('client'), getClientApprovalTimesheets);
router.put('/:id/client-approve', protect, authorize('client'), clientApproveTimesheet);

module.exports = router;