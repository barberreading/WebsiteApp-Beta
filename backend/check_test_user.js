const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkTestUser = async () => {
  try {
    await connectDB();
    
    const testUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    
    if (!testUser) {
      console.log('Test user not found');
      process.exit(1);
    }
    
    console.log('Test user found:');
    console.log('Name:', testUser.name);
    console.log('Email:', testUser.email);
    console.log('Role:', testUser.role);
    console.log('Password hash:', testUser.password);
    
    // Test password comparison
    const isMatch = await bcrypt.compare('password123', testUser.password);
    console.log('Password comparison result:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking test user:', error);
    process.exit(1);
  }
};

checkTestUser();