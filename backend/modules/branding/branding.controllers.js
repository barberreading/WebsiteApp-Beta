const asyncHandler = require('../../middleware/async');
const brandingService = require('./branding.services');

// @route   GET api/branding
// @desc    Get branding configuration
// @access  Public
exports.getBranding = asyncHandler(async (req, res) => {
  const branding = await brandingService.getBranding();
  res.json(branding);
});

// @route   PUT api/branding
// @desc    Update branding configuration
// @access  Private/Admin
exports.updateBranding = asyncHandler(async (req, res) => {
  const branding = await brandingService.updateBranding(req.body);
  res.json(branding);
});

// @route   POST api/branding/upload-logo
// @desc    Upload company logo
// @access  Private/Admin
exports.uploadLogo = asyncHandler(async (req, res) => {
  const { logoData } = req.body;
  const logo = await brandingService.uploadLogo(logoData);
  res.json({ success: true, logo });
});