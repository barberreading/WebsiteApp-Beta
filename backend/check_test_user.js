const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkTestUser = async () => {
  try {
    await connectDB();
    
    const testUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    
    if (!testUser) {
      logger.log('Test user not found');
      process.exit(1);
    }
    
    logger.log('Test user found:');
    logger.log('Name:', testUser.name);
    logger.log('Email:', testUser.email);
    logger.log('Role:', testUser.role);
    logger.log('Password hash:', testUser.password);
    
    // Test password comparison
    const isMatch = await bcrypt.compare('password123', testUser.password);
    logger.log('Password comparison result:', isMatch);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error checking test user:', error);
    process.exit(1);
  }
};

checkTestUser();