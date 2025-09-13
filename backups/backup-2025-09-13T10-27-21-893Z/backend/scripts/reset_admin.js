const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected');
    
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ERROR: ADMIN_PASSWORD environment variable not set');
      console.log('Please set ADMIN_PASSWORD environment variable before running this script');
      process.exit(1);
    }
    
    // Find admin user
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Create new admin if not exists
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      const newAdmin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'superuser',
        consentGiven: true,
        isTemporaryPassword: false
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully');
    } else {
      // Update existing admin password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      adminUser.password = hashedPassword;
      adminUser.isTemporaryPassword = false;
      await adminUser.save();
      
      console.log('Admin password reset successfully');
    }
    
    console.log('Done! You can now log in with the configured credentials');
    
    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetAdmin();