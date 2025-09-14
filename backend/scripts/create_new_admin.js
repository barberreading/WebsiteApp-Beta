const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  logger.log('MongoDB Connected');
  
  try {
    // Delete existing admin user first
    await User.deleteOne({ email: 'admin@example.com' });
    logger.log('Deleted existing admin user if any');
    
    // Create a completely new admin user
    const newAdmin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // Simple password
      role: 'superuser',
      isTemporaryPassword: false
    });
    
    await newAdmin.save();
    logger.log('New admin user created successfully');
    logger.log('Login with:');
    logger.log('Email: admin@example.com');
    logger.log('Password: password123');
    
    process.exit(0);
  } catch (err) {
    logger.error('Error:', err);
    process.exit(1);
  }
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});