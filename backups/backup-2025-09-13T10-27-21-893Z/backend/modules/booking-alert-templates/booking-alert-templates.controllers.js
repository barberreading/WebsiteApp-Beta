const bookingAlertTemplateService = require('./booking-alert-templates.services.js');
const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');

exports.getBookingAlertTemplates = asyncHandler(async (req, res, next) => {
  const templates = await bookingAlertTemplateService.getBookingAlertTemplates();

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates,
  });
});

exports.getBookingAlertTemplate = asyncHandler(async (req, res, next) => {
  try {
    const template = await bookingAlertTemplateService.getBookingAlertTemplate(req.params.id);
    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 404));
  }
});

exports.createBookingAlertTemplate = asyncHandler(async (req, res, next) => {
  const populatedTemplate = await bookingAlertTemplateService.createBookingAlertTemplate(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: populatedTemplate,
    message: 'Template created successfully',
  });
});

exports.updateBookingAlertTemplate = asyncHandler(async (req, res, next) => {
  try {
    const template = await bookingAlertTemplateService.updateBookingAlertTemplate(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 404));
  }
});

exports.deleteBookingAlertTemplate = asyncHandler(async (req, res, next) => {
  try {
    await bookingAlertTemplateService.deleteBookingAlertTemplate(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 404));
  }
});

exports.createBookingAlertFromTemplate = asyncHandler(async (req, res, next) => {
  try {
    const populatedAlert = await bookingAlertTemplateService.createBookingAlertFromTemplate(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: populatedAlert,
      message: 'Booking alert created from template successfully',
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});