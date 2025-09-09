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
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      // Create new admin if not exists
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'superuser',
        consentGiven: true,
        isTemporaryPassword: false
      });
      
      await newAdmin.save();
      console.log('Admin user created with password: admin123');
    } else {
      // Update existing admin password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser.password = hashedPassword;
      adminUser.isTemporaryPassword = false;
      await adminUser.save();
      
      console.log('Admin password reset to: admin123');
    }
    
    console.log('Done! You can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetAdmin();