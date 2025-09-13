const User = require('../../models/User');
const Booking = require('../../models/Booking');
const mongoose = require('mongoose');

/**
 * @summary Get all data for a user
 * @description Retrieves all data for a given user, including their profile and bookings.
 * @param {string} userId - The ID of the user.
 * @param {string} userRole - The role of the user.
 * @returns {object} An object containing the user's data.
 * @throws {Error} If the user is not found.
 */
const getMyData = async (userId, userRole) => {
    const userData = await User.findById(userId).select('-password');

    let bookings;
    if (userRole === 'staff') {
        bookings = await Booking.find({ staff: userId });
    } else if (userRole === 'client') {
        bookings = await Booking.find({ client: userId });
    } else if (userRole === 'manager') {
        bookings = await Booking.find({
            $or: [{ manager: userId }, { createdBy: userId }]
        });
    }

    userData.gdprRequests.push({
        type: 'data-access',
        date: new Date(),
        fulfilled: true
    });
    await userData.save();

    return {
        userData,
        bookings,
        dataAccessDate: new Date()
    };
};

/**
 * @summary Update user consent
 * @description Updates the user's GDPR consent status.
 * @param {string} userId - The ID of the user.
 * @param {object} consentData - The consent data.
 * @returns {object} The updated consent record.
 * @throws {Error} If the user is not found.
 */
const updateConsent = async (userId, consentData) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.gdprConsent = {
        given: consentData.consent === true,
        date: new Date(),
        details: consentData.details || 'General data processing consent'
    };

    await user.save();

    return user.gdprConsent;
};

/**
 * @summary Delete user data
 * @description Anonymizes a user's personal data in accordance with GDPR requirements.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object indicating whether manual processing is required.
 * @throws {Error} If the user is not found.
 */
const deleteMyData = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (['superuser', 'manager'].includes(user.role)) {
        user.gdprRequests.push({
            type: 'deletion-request',
            date: new Date(),
            fulfilled: false,
            notes: 'Requires manual processing due to role permissions'
        });

        await user.save();

        return { requiresManualProcessing: true };
    }

    user.name = 'Deleted User';
    user.email = `deleted-${user.id}@example.com`;
    user.address = '';
    user.phone = '';
    user.location = { coordinates: [0, 0] };
    user.isActive = false;
    user.gdprRequests.push({
        type: 'deletion',
        date: new Date(),
        fulfilled: true
    });

    await user.save();

    return { requiresManualProcessing: false };
};

/**
 * @summary Get all GDPR requests
 * @description Retrieves all GDPR requests, either for a specific user or for all users if the user is an admin.
 * @param {string} userId - The ID of the user.
 * @param {string} userRole - The role of the user.
 * @returns {Array} A list of GDPR requests.
 */
const getRequests = async (userId, userRole) => {
    let requests = [];

    if (['superuser', 'manager'].includes(userRole)) {
        const users = await User.find({ 'gdprRequests.0': { $exists: true } })
            .select('name email gdprRequests');

        users.forEach(user => {
            user.gdprRequests.forEach(request => {
                requests.push({
                    _id: request._id,
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    type: request.type,
                    status: request.fulfilled ? 'approved' : 'pending',
                    createdAt: request.date,
                    updatedAt: request.date
                });
            });
        });
    } else {
        const user = await User.findById(userId).select('gdprRequests');

        if (user && user.gdprRequests) {
            requests = user.gdprRequests.map(request => ({
                _id: request._id,
                type: request.type,
                status: request.fulfilled ? 'approved' : 'pending',
                createdAt: request.date,
                updatedAt: request.date
            }));
        }
    }

    return requests;
};

/**
 * @summary Submit a data access request
 * @description Submits a data access request for a user.
 * @param {string} userId - The ID of the user.
 * @throws {Error} If the user is not found.
 */
const submitDataRequest = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.gdprRequests.push({
        type: 'data-access',
        date: new Date(),
        fulfilled: false
    });

    await user.save();
};

/**
 * @summary Submit a data deletion request
 * @description Submits a data deletion request for a user.
 * @param {string} userId - The ID of the user.
 * @throws {Error} If the user is not found.
 */
const submitDeletionRequest = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.gdprRequests.push({
        type: 'deletion-request',
        date: new Date(),
        fulfilled: false
    });

    await user.save();
};

/**
 * @summary Process a GDPR request
 * @description Processes a GDPR request, either approving or rejecting it.
 * @param {string} requestId - The ID of the request.
 * @param {string} processorId - The ID of the user processing the request.
 * @param {string} status - The new status of the request.
 * @returns {object} An object containing the request ID and the new status.
 * @throws {Error} If the status is invalid, the request is not found, or the request index is not found.
 */
const processRequest = async (requestId, processorId, status) => {
    if (!status || !['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status');
    }

    const user = await User.findOne({
        'gdprRequests._id': mongoose.Types.ObjectId(requestId)
    });

    if (!user) {
        throw new Error('Request not found');
    }

    const requestIndex = user.gdprRequests.findIndex(
        request => request._id.toString() === requestId
    );

    if (requestIndex === -1) {
        throw new Error('Request not found');
    }

    user.gdprRequests[requestIndex].fulfilled = status === 'approved';
    user.gdprRequests[requestIndex].processedBy = processorId;
    user.gdprRequests[requestIndex].processedDate = new Date();

    if (user.gdprRequests[requestIndex].type === 'deletion-request' &&
        status === 'approved') {
        user.name = 'Deleted User';
        user.email = `deleted-${user._id}@example.com`;
        user.address = '';
        user.phone = '';
        user.location = { coordinates: [0, 0] };
        user.isActive = false;
    }

    await user.save();

    return { requestId, status };
};

module.exports = {
    getMyData,
    updateConsent,
    deleteMyData,
    getRequests,
    submitDataRequest,
    submitDeletionRequest,
    processRequest
};