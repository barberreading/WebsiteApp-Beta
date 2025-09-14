const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixFirstNameLastNameFinal() {
  try {
    console.log('Fixing firstName and lastName fields...');
    
    // Connect to database
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected successfully!');
    
    // Get all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users`);
    
    // Update each user with firstName and lastName based on their name field
    for (const user of users) {
      if (user.name && (!user.firstName || !user.lastName)) {
        const nameParts = user.name.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        console.log(`Updating ${user.name} -> firstName: '${firstName}', lastName: '${lastName}'`);
        
        // Use updateOne to directly update the document
        await User.updateOne(
          { _id: user._id },
          { 
            $set: {
              firstName: firstName,
              lastName: lastName
            }
          }
        );
      }
    }
    
    console.log('\n=== VERIFICATION ===');
    const updatedUsers = await User.find({}).select('name firstName lastName email role');
    console.log('Updated users:');
    updatedUsers.forEach(user => {
      console.log(`- Name: ${user.name} | FirstName: ${user.firstName} | LastName: ${user.lastName} | Email: ${user.email}`);
    });
    
    console.log('\n✅ firstName and lastName fields have been fixed!');
    
  } catch (error) {
    console.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixFirstNameLastNameFinal();