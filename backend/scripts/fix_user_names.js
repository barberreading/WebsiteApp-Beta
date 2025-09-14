const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixUserNames() {
  try {
    console.log('Fixing user names...');
    
    // Connect to database
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected successfully!');
    
    // Get all users and check their structure
    const users = await User.find({});
    console.log(`\nFound ${users.length} users. Checking structure...`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`- ID: ${user._id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- firstName: ${user.firstName}`);
      console.log(`- lastName: ${user.lastName}`);
      console.log(`- Full object keys:`, Object.keys(user.toObject()));
      
      if (index >= 2) { // Only show first 3 users to avoid spam
        console.log(`... and ${users.length - 3} more users`);
        return false;
      }
    });
    
    // Check if users have name field instead of firstName/lastName
    const sampleUser = users[0];
    if (sampleUser) {
      const userObj = sampleUser.toObject();
      console.log('\nSample user full structure:', JSON.stringify(userObj, null, 2));
      
      // Check for common name field variations
      const nameFields = ['name', 'fullName', 'displayName', 'username'];
      nameFields.forEach(field => {
        if (userObj[field]) {
          console.log(`Found ${field}: ${userObj[field]}`);
        }
      });
    }
    
    // If users have email but no firstName/lastName, let's extract names from email or create default names
    const usersNeedingNames = users.filter(user => !user.firstName || !user.lastName);
    console.log(`\n${usersNeedingNames.length} users need name fixes`);
    
    if (usersNeedingNames.length > 0) {
      console.log('\nFixing user names...');
      
      for (const user of usersNeedingNames) {
        let firstName, lastName;
        
        // Try to extract name from email
        if (user.email) {
          const emailPart = user.email.split('@')[0];
          const nameParts = emailPart.split('.');
          
          if (nameParts.length >= 2) {
            firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
          } else {
            firstName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
            lastName = 'User';
          }
        } else {
          firstName = 'Unknown';
          lastName = 'User';
        }
        
        console.log(`Updating ${user.email}: ${firstName} ${lastName}`);
        
        await User.findByIdAndUpdate(user._id, {
          firstName: firstName,
          lastName: lastName
        });
      }
      
      console.log('\n✅ User names have been fixed!');
    }
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    const updatedUsers = await User.find({}).select('firstName lastName email role');
    console.log(`Updated users:`);
    updatedUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixUserNames();