const User = require('../models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to database');
    
    const users = await User.find({}, 'name email role').limit(10);
    logger.log('\nAvailable users:');
    users.forEach(user => {
      logger.log(`- Email: ${user.email}`);
      logger.log(`  Role: ${user.role}`);
      logger.log(`  Name: ${user.name}`);
      logger.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();