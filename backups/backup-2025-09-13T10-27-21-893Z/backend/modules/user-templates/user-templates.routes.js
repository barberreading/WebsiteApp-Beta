const express = require('express');
const {
  getAllTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} = require('./user-templates.controllers');
const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

router.route('/').get(protect, getAllTemplates).post(protect, authorize('admin'), createTemplate);

router
  .route('/:id')
  .get(protect, getTemplateById)
  .put(protect, authorize('admin'), updateTemplate)
  .delete(protect, authorize('admin'), deleteTemplate);

module.exports = router;