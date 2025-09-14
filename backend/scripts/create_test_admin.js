const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.log('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

async function createTestAdmin() {
  try {
    logger.log('Creating test admin user...');
    
    // Check if test admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'accounts@everythingchildcareagency.co.uk' 
    });
    
    if (existingAdmin) {
      logger.log('Test admin already exists:', existingAdmin.name);
      logger.log('Email:', existingAdmin.email);
      logger.log('Role:', existingAdmin.role);
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
    logger.log('✅ Successfully created test admin user!');
    logger.log('Name:', testAdmin.name);
    logger.log('Email:', testAdmin.email);
    logger.log('Role:', testAdmin.role);
    logger.log('ID:', testAdmin._id);
    
    return testAdmin;
    
  } catch (error) {
    logger.error('Error creating test admin:', error);
  } finally {
    await mongoose.connection.close();
    logger.log('Database connection closed.');
  }
}

// Run the function
createTestAdmin();