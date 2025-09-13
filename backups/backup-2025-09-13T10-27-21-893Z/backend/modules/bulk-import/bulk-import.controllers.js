const asyncHandler = require('../../middleware/async');
const bulkImportService = require('./bulk-import.services');
const ErrorResponse = require('../../utils/errorResponse');

exports.getTemplates = (req, res) => {
    const { type } = req.params;
    const template = bulkImportService.getTemplate(type);

    if (!template) {
        return res.status(400).json({ message: 'Invalid template type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_template.csv`);
    res.send(template);
}

const uploadFile = async (req, res, uploadService) => {
    if (!req.file) {
        throw new ErrorResponse('No file uploaded', 400);
    }

    try {
        const result = await uploadService(req.file.path);
        res.json(result);
    } catch (error) {
        throw new ErrorResponse('Error processing CSV file', 500);
    }
};

exports.uploadClients = asyncHandler(async (req, res) => {
    await uploadFile(req, res, bulkImportService.uploadClients);
});

exports.uploadUsers = asyncHandler(async (req, res) => {
    await uploadFile(req, res, bulkImportService.uploadUsers);
});