const LeaveRequest = require('../../models/LeaveRequest');
const User = require('../../models/User');
const emailService = require('../email/email.services.js');

const getLeaveRequests = async (user, query) => {
    let requestQuery;

    if (user.role === 'staff') {
        requestQuery = LeaveRequest.find({ staff: user.id });
    } else {
        requestQuery = LeaveRequest.find();
    }

    if (query.status) {
        requestQuery = requestQuery.where('status').equals(query.status);
    }

    if (query.startDate && query.endDate) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        requestQuery = requestQuery.where({
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
            ]
        });
    }

    if (query.staffId && user.role !== 'staff') {
        requestQuery = requestQuery.where('staff').equals(query.staffId);
    }

    requestQuery = requestQuery.sort('-createdAt');

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await LeaveRequest.countDocuments(requestQuery.getQuery());

    requestQuery = requestQuery.skip(startIndex).limit(limit)
        .populate('staff', '_id name email firstName lastName')
        .populate('reviewedBy', '_id name email');

    const leaveRequests = await requestQuery;

    const pagination = {};
    if (endIndex < total) {
        pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
        pagination.prev = { page: page - 1, limit };
    }

    return { leaveRequests, pagination, total };
};

const getLeaveRequest = async (id, user) => {
    const leaveRequest = await LeaveRequest.findById(id)
        .populate('staff', 'name email')
        .populate('reviewedBy', 'name email');

    if (!leaveRequest) {
        throw new Error('Leave request not found');
    }

    if (leaveRequest.staff._id.toString() !== user.id && user.role !== 'manager' && user.role !== 'superuser') {
        throw new Error('Not authorized to access this leave request');
    }

    return leaveRequest;
};

const createLeaveRequest = async (data, user) => {
    data.staff = user.id;

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    if (new Date(data.startDate) < oneWeekFromNow) {
        throw new Error('Leave requests must be submitted at least one week in advance');
    }

    const leaveRequest = await LeaveRequest.create(data);

    try {
        const staff = await User.findById(user.id);
        if (staff) {
            await emailService.sendLeaveRequestSubmissionNotification(leaveRequest, staff);
        }
    } catch (error) {
        logger.error('Error sending leave request submission notification:', error);
    }

    return leaveRequest;
};

const approveLeaveRequest = async (id, user) => {
    let leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
        throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'pending') {
        throw new Error('This leave request has already been reviewed');
    }

    leaveRequest = await LeaveRequest.findByIdAndUpdate(id, {
        status: 'approved',
        reviewedBy: user.id,
        reviewedAt: Date.now()
    }, { new: true, runValidators: true })
        .populate('staff', 'name email')
        .populate('reviewedBy', 'name email');

    try {
        const staff = await User.findById(leaveRequest.staff);
        if (staff) {
            await emailService.sendLeaveRequestStatusNotification(staff, leaveRequest);
        }
    } catch (error) {
        logger.error('Error sending leave request notification:', error);
    }

    return leaveRequest;
};

const denyLeaveRequest = async (id, user, denialReason) => {
    let leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
        throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'pending') {
        throw new Error('This leave request has already been reviewed');
    }

    if (!denialReason) {
        throw new Error('Please provide a reason for denying this leave request');
    }

    leaveRequest = await LeaveRequest.findByIdAndUpdate(id, {
        status: 'denied',
        reviewedBy: user.id,
        reviewedAt: Date.now(),
        denialReason
    }, { new: true, runValidators: true })
        .populate('staff', 'name email')
        .populate('reviewedBy', 'name email');

    try {
        const staff = await User.findById(leaveRequest.staff);
        if (staff) {
            await emailService.sendLeaveRequestStatusNotification(staff, leaveRequest);
        }
    } catch (error) {
        logger.error('Error sending leave request notification:', error);
    }

    return leaveRequest;
};

const withdrawLeaveRequest = async (id, user) => {
    const leaveRequest = await LeaveRequest.findById(id).populate('staff');

    if (!leaveRequest) {
        throw new Error('Leave request not found');
    }

    if (leaveRequest.staff._id.toString() !== user.id) {
        throw new Error('Not authorized to withdraw this leave request');
    }

    if (leaveRequest.status !== 'pending') {
        throw new Error('Only pending leave requests can be withdrawn');
    }

    await LeaveRequest.findByIdAndDelete(id);

    try {
        await emailService.sendLeaveRequestWithdrawalNotification(leaveRequest, leaveRequest.staff);
    } catch (error) {
        logger.error('Error sending leave request withdrawal notification:', error);
    }
};

module.exports = {
    getLeaveRequests,
    getLeaveRequest,
    createLeaveRequest,
    approveLeaveRequest,
    denyLeaveRequest,
    withdrawLeaveRequest
};