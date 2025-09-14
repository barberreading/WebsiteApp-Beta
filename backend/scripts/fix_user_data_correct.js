const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixUserDataCorrect() {
  try {
    logger.log('Fixing user data with correct field names...');
    
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
    
    // Check current user data
    logger.log('\nCurrent user data:');
    users.forEach((user, index) => {
      logger.log(`- ${user.name || 'NO NAME'} (${user.email}) - Role: ${user.role}`);
      if (index >= 4) { // Show first 5 users
        logger.log(`... and ${users.length - 5} more users`);
        return false;
      }
    });
    
    // Fix users that don't have names
    const usersNeedingNames = users.filter(user => !user.name);
    logger.log(`\n${usersNeedingNames.length} users need name fixes`);
    
    if (usersNeedingNames.length > 0) {
      logger.log('\nFixing user names...');
      
      for (const user of usersNeedingNames) {
        let name;
        
        // Try to extract name from email
        if (user.email) {
          const emailPart = user.email.split('@')[0];
          const nameParts = emailPart.split('.');
          
          if (nameParts.length >= 2) {
            const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            const lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
            name = `${firstName} ${lastName}`;
          } else {
            name = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
          }
        } else {
          name = 'Unknown User';
        }
        
        logger.log(`Updating ${user.email}: ${name}`);
        
        await User.findByIdAndUpdate(user._id, {
          name: name
        });
      }
      
      logger.log('\n✅ User names have been fixed!');
    }
    
    // Verify the fix
    logger.log('\n=== VERIFICATION ===');
    const updatedUsers = await User.find({}).select('name email role');
    logger.log(`Updated users:`);
    updatedUsers.forEach(user => {
      logger.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Now let's also check if we need to add firstName and lastName fields for the calendar
    logger.log('\n=== ADDING FIRSTNAME/LASTNAME FOR CALENDAR COMPATIBILITY ===');
    for (const user of updatedUsers) {
      if (user.name && (!user.firstName || !user.lastName)) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        await User.findByIdAndUpdate(user._id, {
          firstName: firstName,
          lastName: lastName
        });
        
        logger.log(`Added firstName/lastName for ${user.name}: ${firstName} ${lastName}`);
      }
    }
    
    logger.log('\n✅ All user data has been fixed!');
    
  } catch (error) {
    logger.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    logger.log('\nDatabase connection closed');
  }
}

fixUserDataCorrect();