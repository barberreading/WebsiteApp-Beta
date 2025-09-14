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

const createTestUser = async () => {
  try {
    await connectDB();
    
    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Deleted existing test user');
    
    // Create test user with plain password (let mongoose middleware handle hashing)
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'staff',
      isTestUser: true
    });
    
    await testUser.save();
    console.log('Test user created successfully');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    // Verify the password works
    const savedUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    const isMatch = await savedUser.matchPassword('password123');
    console.log('Password verification:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();