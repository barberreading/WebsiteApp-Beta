const asyncHandler = require('../../middleware/async');
const gdprService = require('./gdpr.services');

/**
 * @summary Get all data for a user
 * @description Retrieves all data for a given user, including their profile and bookings.
 * @route GET /api/v1/gdpr/my-data
 * @access Private
 */
const getMyData = asyncHandler(async (req, res) => {
    const allData = await gdprService.getMyData(req.user.id, req.user.role);
    res.json(allData);
});

/**
 * @summary Update user consent
 * @description Updates the user's GDPR consent status.
 * @route POST /api/v1/gdpr/consent
 * @access Private
 */
const updateConsent = asyncHandler(async (req, res) => {
    const consentRecord = await gdprService.updateConsent(req.user.id, req.body);
    res.json({
        msg: `Consent ${consentRecord.given ? 'given' : 'withdrawn'}`,
        consentRecord
    });
});

/**
 * @summary Delete user data
 * @description Anonymizes a user's personal data in accordance with GDPR requirements.
 * @route DELETE /api/v1/gdpr/delete-my-data
 * @access Private
 */
const deleteMyData = asyncHandler(async (req, res) => {
    const result = await gdprService.deleteMyData(req.user.id);
    if (result.requiresManualProcessing) {
        return res.json({
            msg: 'Deletion request received. Due to your role, this requires manual processing.',
            requestDate: new Date()
        });
    }
    res.json({
        msg: 'Your personal data has been anonymized per GDPR requirements',
        deletionDate: new Date()
    });
});

/**
 * @summary Get all GDPR requests
 * @description Retrieves all GDPR requests, either for a specific user or for all users if the user is an admin.
 * @route GET /api/v1/gdpr/requests
 * @access Private
 */
const getRequests = asyncHandler(async (req, res) => {
    const requests = await gdprService.getRequests(req.user.id, req.user.role);
    res.json(requests);
});

/**
 * @summary Submit a data access request
 * @description Submits a data access request for a user.
 * @route POST /api/v1/gdpr/data-request
 * @access Private
 */
const submitDataRequest = asyncHandler(async (req, res) => {
    await gdprService.submitDataRequest(req.user.id);
    res.json({
        msg: 'Data access request submitted successfully',
        requestDate: new Date()
    });
});

/**
 * @summary Submit a data deletion request
 * @description Submits a data deletion request for a user.
 * @route POST /api/v1/gdpr/deletion-request
 * @access Private
 */
const submitDeletionRequest = asyncHandler(async (req, res) => {
    await gdprService.submitDeletionRequest(req.user.id);
    res.json({
        msg: 'Deletion request submitted successfully',
        requestDate: new Date()
    });
});

/**
 * @summary Process a GDPR request
 * @description Processes a GDPR request, either approving or rejecting it.
 * @route PUT /api/v1/gdpr/requests/:id
 * @access Private
 */
const processRequest = asyncHandler(async (req, res) => {
    const { requestId, status } = await gdprService.processRequest(req.params.id, req.user.id, req.body.status);
    res.json({
        msg: `Request ${status} successfully`,
        requestId,
        status
    });
});

module.exports = {
    getMyData,
    updateConsent,
    deleteMyData,
    getRequests,
    submitDataRequest,
    submitDeletionRequest,
    processRequest
};