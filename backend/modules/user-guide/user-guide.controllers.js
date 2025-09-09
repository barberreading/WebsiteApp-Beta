const userGuideService = require('./user-guide.services');

// Get user guide content
exports.getUserGuide = async (req, res) => {
  // Only superusers can access the edit functionality
  if (req.user.role !== 'superuser') {
    return res.status(403).json({ msg: 'Not authorized to edit user guide' });
  }

  const content = await userGuideService.getUserGuide();
  res.json({ content });
};

// Update user guide content
exports.updateUserGuide = async (req, res) => {
  // Only superusers can update the user guide
  if (req.user.role !== 'superuser') {
    return res.status(403).json({ msg: 'Not authorized to edit user guide' });
  }

  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ msg: 'Content is required' });
  }

  await userGuideService.updateUserGuide(content);

  res.json({ msg: 'User guide updated successfully' });
};