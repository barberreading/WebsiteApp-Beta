const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const plainPassword = process.env.ADMIN_PASSWORD;
    
    if (!plainPassword) {
      console.error('ERROR: ADMIN_PASSWORD environment variable not set');
      console.log('Please set ADMIN_PASSWORD environment variable before running this script');
      process.exit(1);
    }
    
    // Hash the password directly with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Update admin user with new password hash
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        $set: { 
          password: hashedPassword,
          isTemporaryPassword: false
        }
      },
      { new: true }
    );
    
    if (!user) {
      console.log('Admin user not found, creating new admin user');
      
      // Create new admin user if not found
      const newAdmin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword, // This will be hashed by the pre-save hook
        role: 'admin',
        isTemporaryPassword: false
      });
      
      await newAdmin.save();
      console.log('New admin user created');
    } else {
      console.log('Admin user found and password updated');
    }
    
    // Test login directly with API
    console.log('Testing login with API...');
    try {
      const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
        email: adminEmail,
        password: plainPassword
      });
      
      console.log('Login successful!');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    } catch (error) {
      console.error('Login failed!');
      console.error('Error:', error.response ? error.response.data : error.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});