const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetTestStaffPassword() {
  try {
    logger.log('🔍 Finding test staff user...');
    
    const testStaff = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    
    if (!testStaff) {
      logger.log('❌ Test staff user not found');
      return;
    }
    
    logger.log('✅ Found test staff user:', testStaff.name);
    logger.log('Current password hash:', testStaff.password);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    await User.findByIdAndUpdate(testStaff._id, { 
      password: hashedPassword,
      isActive: true // Also ensure the user is active
    });
    
    logger.log('✅ Password reset to "admin123" for test staff user');
    logger.log('✅ User set to active');
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
  } finally {
    logger.log('🔌 Disconnecting from MongoDB');
    mongoose.disconnect();
  }
}

resetTestStaffPassword();