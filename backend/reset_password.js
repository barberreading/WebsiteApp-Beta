const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the test user
    const testUser = await User.findOne({ email: 'barberreading@hotmail.co.uk' });
    
    if (!testUser) {
      console.log('Test user not found');
      return;
    }
    
    console.log('Found test user:', testUser.name);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    testUser.password = hashedPassword;
    await testUser.save();
    
    console.log('✅ Password reset to "admin123" for test user');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });