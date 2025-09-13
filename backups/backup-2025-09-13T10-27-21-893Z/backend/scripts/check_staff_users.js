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
    console.log('✅ Connected to MongoDB');
    
    // Find all users
    const allUsers = await User.find({});
    console.log('\n📊 All Users in Database:');
    console.log('Total users:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    // Find staff users specifically
    const staffUsers = await User.find({ role: 'staff' });
    console.log('\n👥 Staff Users:');
    console.log('Total staff:', staffUsers.length);
    
    staffUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id} - Active: ${user.isActive}`);
    });
    
    // Check if there's a test staff user
    const testStaff = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    if (testStaff) {
      console.log('\n🎯 Found Test Staff User:');
      console.log('Name:', testStaff.name);
      console.log('Email:', testStaff.email);
      console.log('Role:', testStaff.role);
      console.log('ID:', testStaff._id);
      console.log('Active:', testStaff.isActive);
    } else {
      console.log('\n❌ No test staff user found with email barberreading@hotmail.co.uk');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkStaffUsers();