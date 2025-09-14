const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixUserNames() {
  try {
    logger.log('Fixing user names...');
    
    // Connect to database
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.log('Connected successfully!');
    
    // Get all users and check their structure
    const users = await User.find({});
    logger.log(`\nFound ${users.length} users. Checking structure...`);
    
    users.forEach((user, index) => {
      logger.log(`\nUser ${index + 1}:`);
      logger.log(`- ID: ${user._id}`);
      logger.log(`- Email: ${user.email}`);
      logger.log(`- Role: ${user.role}`);
      logger.log(`- firstName: ${user.firstName}`);
      logger.log(`- lastName: ${user.lastName}`);
      logger.log(`- Full object keys:`, Object.keys(user.toObject()));
      
      if (index >= 2) { // Only show first 3 users to avoid spam
        logger.log(`... and ${users.length - 3} more users`);
        return false;
      }
    });
    
    // Check if users have name field instead of firstName/lastName
    const sampleUser = users[0];
    if (sampleUser) {
      const userObj = sampleUser.toObject();
      logger.log('\nSample user full structure:', JSON.stringify(userObj, null, 2));
      
      // Check for common name field variations
      const nameFields = ['name', 'fullName', 'displayName', 'username'];
      nameFields.forEach(field => {
        if (userObj[field]) {
          logger.log(`Found ${field}: ${userObj[field]}`);
        }
      });
    }
    
    // If users have email but no firstName/lastName, let's extract names from email or create default names
    const usersNeedingNames = users.filter(user => !user.firstName || !user.lastName);
    logger.log(`\n${usersNeedingNames.length} users need name fixes`);
    
    if (usersNeedingNames.length > 0) {
      logger.log('\nFixing user names...');
      
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
        
        logger.log(`Updating ${user.email}: ${firstName} ${lastName}`);
        
        await User.findByIdAndUpdate(user._id, {
          firstName: firstName,
          lastName: lastName
        });
      }
      
      logger.log('\n✅ User names have been fixed!');
    }
    
    // Verify the fix
    logger.log('\n=== VERIFICATION ===');
    const updatedUsers = await User.find({}).select('firstName lastName email role');
    logger.log(`Updated users:`);
    updatedUsers.forEach(user => {
      logger.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    logger.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    logger.log('\nDatabase connection closed');
  }
}

fixUserNames();