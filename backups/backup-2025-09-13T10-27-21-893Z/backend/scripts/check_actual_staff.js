const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkStaffUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const staffUsers = await User.find({ role: 'staff' }).select('email firstName lastName _id');
    console.log(`Found ${staffUsers.length} staff users:`);
    
    staffUsers.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.firstName} ${staff.lastName} - ${staff.email} (ID: ${staff._id})`);
    });
    
    if (staffUsers.length > 0) {
      console.log('\nUsing first staff user for testing...');
      return staffUsers[0];
    } else {
      console.log('No staff users found!');
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkStaffUsers();