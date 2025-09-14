const mongoose = require('mongoose');
require('dotenv').config();

// User model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkStaffUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staff_management');
    logger.log('✅ Connected to MongoDB');
    
    // Find all users
    const allUsers = await User.find({});
    logger.log('\n📊 All Users in Database:');
    logger.log('Total users:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      logger.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    // Find staff users specifically
    const staffUsers = await User.find({ role: 'staff' });
    logger.log('\n👥 Staff Users:');
    logger.log('Total staff:', staffUsers.length);
    
    staffUsers.forEach((user, index) => {
      logger.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id} - Active: ${user.isActive}`);
    });
    
    // Check if there's a test staff user
    const testStaff = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (testStaff) {
      logger.log('\n🎯 Found Test Staff User:');
      logger.log('Name:', testStaff.name);
      logger.log('Email:', testStaff.email);
      logger.log('Role:', testStaff.role);
      logger.log('ID:', testStaff._id);
      logger.log('Active:', testStaff.isActive);
    } else {
      logger.log('\n❌ No test staff user found with email barberreading@hotmail.co.uk');
    }
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('\n🔌 Disconnected from MongoDB');
  }
}

checkStaffUsers();