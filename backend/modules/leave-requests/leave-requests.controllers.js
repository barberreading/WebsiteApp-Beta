const asyncHandler = require('../../middleware/async');
const leaveRequestService = require('./leave-requests.services');

exports.getLeaveRequests = asyncHandler(async (req, res) => {
    const { leaveRequests, pagination, total } = await leaveRequestService.getLeaveRequests(req.user, req.query);
    res.status(200).json({
        success: true,
        count: leaveRequests.length,
        pagination,
        data: leaveRequests
    });
});

exports.getLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await leaveRequestService.getLeaveRequest(req.params.id, req.user);
    res.status(200).json({
        success: true,
        data: leaveRequest
    });
});

exports.createLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await leaveRequestService.createLeaveRequest(req.body, req.user);
    res.status(201).json({
        success: true,
        data: leaveRequest
    });
});

exports.approveLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await leaveRequestService.approveLeaveRequest(req.params.id, req.user);
    res.status(200).json({
        success: true,
        data: leaveRequest
    });
});

exports.denyLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await leaveRequestService.denyLeaveRequest(req.params.id, req.user, req.body.denialReason);
    res.status(200).json({
        success: true,
        data: leaveRequest
    });
});

exports.withdrawLeaveRequest = asyncHandler(async (req, res) => {
    await leaveRequestService.withdrawLeaveRequest(req.params.id, req.user);
    res.status(200).json({
        success: true,
        message: 'Leave request withdrawn successfully'
    });
});