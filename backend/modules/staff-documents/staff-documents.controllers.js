const asyncHandler = require('../../middleware/async');
const staffDocumentService = require('./staff-documents.services');
const path = require('path');

exports.uploadStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.uploadStaffDocument(req.user, req.file, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.getStaffDocuments = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.getStaffDocuments(req.user, req.query);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.getStaffDocumentById = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.getStaffDocumentById(req.user, req.params.id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.downloadStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.downloadStaffDocument(req.user, req.params.id);
  if (result.success) {
    res.download(result.data.filePath, path.basename(result.data.filePath));
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.getPublicStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.getPublicStaffDocument(req.params.accessKey);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.downloadPublicStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.downloadPublicStaffDocument(req.params.accessKey);
  if (result.success) {
    res.download(result.data.filePath, path.basename(result.data.filePath));
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.updateStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.updateStaffDocument(req.user, req.params.id, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});

exports.deleteStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffDocumentService.deleteStaffDocument(req.user, req.params.id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.statusCode).json({ msg: result.message });
  }
});