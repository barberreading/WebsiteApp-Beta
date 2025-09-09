const asyncHandler = require('../../middleware/async');
const hrDocumentAccessService = require('./hr-document-access.services');

const getHrDocumentAccess = asyncHandler(async (req, res) => {
    const result = await hrDocumentAccessService.getHrDocumentAccess();
    res.json(result);
});

module.exports = {
    getHrDocumentAccess
};