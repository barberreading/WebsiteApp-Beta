const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...');
    
    // Check if test admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'accounts@everythingchildcareagency.co.uk' 
    });
    
    if (existingAdmin) {
      console.log('Test admin already exists:', existingAdmin.name);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return existingAdmin;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TestAdmin123!', salt);
    
    // Create test admin user (using manager role since admin is not valid)
    const testAdmin = new User({
      name: 'Test Admin',
      email: 'accounts@everythingchildcareagency.co.uk',
      password: hashedPassword,
      role: 'manager',
      isActive: true,
      isTestUser: true, // Mark as test user for superuser visibility
      createdBy: null // Will be set by superuser
    });
    
    await testAdmin.save();
    console.log('✅ Successfully created test admin user!');
    console.log('Name:', testAdmin.name);
    console.log('Email:', testAdmin.email);
    console.log('Role:', testAdmin.role);
    console.log('ID:', testAdmin._id);
    
    return testAdmin;
    
  } catch (error) {
    console.error('Error creating test admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the function
createTestAdmin();