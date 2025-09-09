const User = require('../models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const users = await User.find({}, 'name email role').limit(10);
    console.log('\nAvailable users:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Name: ${user.name}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();