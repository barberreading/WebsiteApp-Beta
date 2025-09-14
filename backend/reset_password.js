const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('Connected to MongoDB');
    
    // Find the test user
    const testUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    
    if (!testUser) {
      logger.log('Test user not found');
      return;
    }
    
    logger.log('Found test user:', testUser.name);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    testUser.password = hashedPassword;
    await testUser.save();
    
    logger.log('✅ Password reset to "admin123" for test user');
    mongoose.disconnect();
  })
  .catch(err => {
    logger.error('Error:', err);
    mongoose.disconnect();
  });