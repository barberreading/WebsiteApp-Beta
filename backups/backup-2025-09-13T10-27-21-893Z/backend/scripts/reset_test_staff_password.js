const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staff-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetTestStaffPassword() {
  try {
    console.log('🔍 Finding test staff user...');
    
    const testStaff = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    
    if (!testStaff) {
      console.log('❌ Test staff user not found');
      return;
    }
    
    console.log('✅ Found test staff user:', testStaff.name);
    console.log('Current password hash:', testStaff.password);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    await User.findByIdAndUpdate(testStaff._id, { 
      password: hashedPassword,
      isActive: true // Also ensure the user is active
    });
    
    console.log('✅ Password reset to "admin123" for test staff user');
    console.log('✅ User set to active');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('🔌 Disconnecting from MongoDB');
    mongoose.disconnect();
  }
}

resetTestStaffPassword();