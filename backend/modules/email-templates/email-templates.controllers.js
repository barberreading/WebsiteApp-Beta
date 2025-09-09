const asyncHandler = require('../../middleware/async');
const emailTemplateService = require('./email-templates.services');

exports.getEmailTemplates = asyncHandler(async (req, res) => {
  const templates = await emailTemplateService.getEmailTemplates();
  res.json({ success: true, data: templates });
});

exports.getEmailTemplateById = asyncHandler(async (req, res) => {
  const template = await emailTemplateService.getEmailTemplateById(req.params.id);
  res.json({ success: true, data: template });
});

exports.createEmailTemplate = asyncHandler(async (req, res) => {
  const template = await emailTemplateService.createEmailTemplate(req.body, req.user.id);
  res.status(201).json({ success: true, data: template, message: 'Template created successfully' });
});

exports.updateEmailTemplate = asyncHandler(async (req, res) => {
  const template = await emailTemplateService.updateEmailTemplate(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: template, message: 'Template updated successfully' });
});

exports.deleteEmailTemplate = asyncHandler(async (req, res) => {
  await emailTemplateService.deleteEmailTemplate(req.params.id);
  res.json({ success: true, message: 'Template deleted successfully' });
});