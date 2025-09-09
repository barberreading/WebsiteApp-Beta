const userTemplatesService = require('./user-templates.services');
const asyncHandler = require('../../middleware/async');

// @desc    Get all user templates
// @route   GET /api/user-templates
// @access  Private
exports.getAllTemplates = asyncHandler(async (req, res, next) => {
  const templates = await userTemplatesService.getAllTemplates();
  res.status(200).json({ success: true, data: templates });
});

// @desc    Create a user template
// @route   POST /api/user-templates
// @access  Private
exports.createTemplate = asyncHandler(async (req, res, next) => {
  const template = await userTemplatesService.createTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

// @desc    Get a single user template
// @route   GET /api/user-templates/:id
// @access  Private
exports.getTemplateById = asyncHandler(async (req, res, next) => {
  const template = await userTemplatesService.getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  res.status(200).json({ success: true, data: template });
});

// @desc    Update a user template
// @route   PUT /api/user-templates/:id
// @access  Private
exports.updateTemplate = asyncHandler(async (req, res, next) => {
  const template = await userTemplatesService.updateTemplate(req.params.id, req.body);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  res.status(200).json({ success: true, data: template });
});

// @desc    Delete a user template
// @route   DELETE /api/user-templates/:id
// @access  Private
exports.deleteTemplate = asyncHandler(async (req, res, next) => {
  const template = await userTemplatesService.deleteTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  res.status(200).json({ success: true, data: {} });
});