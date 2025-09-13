const asyncHandler = require('../../middleware/async');
const { updateUserPhoto } = require('./image-upload.services');

const uploadPhoto = asyncHandler(async (req, res) => {
  const { photoData } = req.body;
  
  if (!photoData) {
    return res.status(400).json({ msg: 'No photo data provided' });
  }
  
  const updatedPhoto = await updateUserPhoto(req.user.id, photoData);
  
  res.json({ success: true, photo: updatedPhoto });
});

module.exports = {
  uploadPhoto,
};