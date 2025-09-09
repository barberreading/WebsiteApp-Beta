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
    // Find admin user
    const adminEmail = 'admin@example.com';
    const plainPassword = 'admin123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Update or create admin user
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        $set: { 
          password: hashedPassword,
          isTemporaryPassword: false
        }
      },
      { new: true, upsert: false }
    );
    
    if (user) {
      console.log('Admin password reset successfully');
      console.log('Login with:');
      console.log('Email:', adminEmail);
      console.log('Password:', plainPassword);
    } else {
      console.log('Admin user not found');
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