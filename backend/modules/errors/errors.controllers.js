const asyncHandler = require('../../middleware/async');
const errorService = require('./errors.services');

const logFrontendError = asyncHandler(async (req, res) => {
    await errorService.logFrontendError(req.body, req.headers.authorization);
    res.status(200).json({ success: true, message: 'Error logged successfully' });
});

const getErrors = asyncHandler(async (req, res) => {
    const result = await errorService.getErrors(req.query);
    res.json(result);
});

const resolveError = asyncHandler(async (req, res) => {
    const updatedLog = await errorService.resolveError(req.params.id, req.user.id, req.body.resolution);
    res.json({ success: true, data: updatedLog });
});

module.exports = {
    logFrontendError,
    getErrors,
    resolveError
};