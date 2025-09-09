const express = require('express');
const router = express.Router();
const { protect: auth, role } = require('../../middleware/auth');
const { getEmailTemplates, getEmailTemplateById, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } = require('./email-templates.controllers');

// @route   GET /api/email-templates
// @desc    Get all email templates
// @access  Private (manager, superuser, admin)
router.get('/', auth, role(['manager', 'superuser', 'admin']), getEmailTemplates);

// @route   GET /api/email-templates/:id
// @desc    Get email template by ID
// @access  Private (manager, superuser, admin)
router.get('/:id', auth, role(['manager', 'superuser', 'admin']), getEmailTemplateById);

// @route   POST /api/email-templates
// @desc    Create a new email template
// @access  Private (superuser, admin)
router.post('/', auth, role(['superuser', 'admin']), createEmailTemplate);

// @route   PUT /api/email-templates/:id
// @desc    Update an email template
// @access  Private (superuser, admin)
router.put('/:id', auth, role(['superuser', 'admin']), updateEmailTemplate);

// @route   DELETE /api/email-templates/:id
// @desc    Delete an email template
// @access  Private (superuser, admin)
router.delete('/:id', auth, role(['superuser', 'admin']), deleteEmailTemplate);

module.exports = router;