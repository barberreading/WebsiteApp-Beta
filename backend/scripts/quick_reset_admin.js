const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function quickResetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected');
    
    // Find the existing admin user
    const adminUser = await User.findOne({ email: 'andrew@everythingchildcareagency.co.uk' });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      process.exit(1);
    }
    
    // Reset password to 'admin123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('Admin password reset successfully!');
    console.log('Email: andrew@everythingchildcareagency.co.uk');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

quickResetAdmin();