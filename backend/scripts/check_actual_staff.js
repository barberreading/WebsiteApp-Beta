const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkStaffUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
    
    const staffUsers = await User.find({ role: 'staff' }).select('email firstName lastName _id');
    logger.log(`Found ${staffUsers.length} staff users:`);
    
    staffUsers.forEach((staff, index) => {
      logger.log(`${index + 1}. ${staff.firstName} ${staff.lastName} - ${staff.email} (ID: ${staff._id})`);
    });
    
    if (staffUsers.length > 0) {
      logger.log('\nUsing first staff user for testing...');
      return staffUsers[0];
    } else {
      logger.log('No staff users found!');
      return null;
    }
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkStaffUsers();