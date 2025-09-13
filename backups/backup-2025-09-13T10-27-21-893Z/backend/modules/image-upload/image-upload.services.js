const User = require('../../models/User');

const updateUserPhoto = async (userId, photoData) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { photo: photoData } },
      { new: true }
    ).select('-password');
    
    return user.photo;
  } catch (err) {
    console.error('Error updating photo in service:', err.message);
    throw new Error('Server Error');
  }
};

module.exports = {
  updateUserPhoto,
};