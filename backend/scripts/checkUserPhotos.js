const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');

const checkUserPhotos = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users and show their photo status
    const users = await User.find({}, 'name email role photo').sort({ name: 1 });
    
    console.log('\n=== Current User Photo Status ===');
    users.forEach(user => {
      const photoStatus = user.photo ? 
        (user.photo.startsWith('data:image') ? 'Has photo (base64)' : 'Has photo (URL)') : 
        'No photo';
      
      console.log(`${user.name} (${user.role}): ${photoStatus}`);
      if (user.photo && user.photo.length > 100) {
        console.log(`  Photo preview: ${user.photo.substring(0, 50)}...`);
      } else if (user.photo) {
        console.log(`  Photo: ${user.photo}`);
      }
    });
    
    // Check specifically for the three original staff members
    console.log('\n=== Original Staff Members Check ===');
    const originalStaff = ['Andrew Barber', 'Sarah Johnson', 'Michael Smith'];
    
    for (const staffName of originalStaff) {
      const user = await User.findOne({ name: staffName });
      if (user) {
        console.log(`${staffName}: Found - Photo status: ${user.photo ? 'Has photo' : 'No photo'}`);
        if (user.photo) {
          console.log(`  Photo type: ${user.photo.startsWith('data:image') ? 'Base64 encoded' : 'URL/Other'}`);
        }
      } else {
        console.log(`${staffName}: Not found in database`);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error checking user photos:', error);
    process.exit(1);
  }
};

checkUserPhotos();