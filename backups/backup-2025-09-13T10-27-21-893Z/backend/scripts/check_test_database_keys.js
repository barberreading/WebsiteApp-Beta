const mongoose = require('mongoose');
require('dotenv').config();

// Define BookingKey schema (assuming it exists)
const bookingKeySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BookingKey = mongoose.model('BookingKey', bookingKeySchema, 'bookingkeys');

async function checkTestDatabaseKeys() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Database URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('Connected to database:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check if bookingkeys collection exists
    const bookingKeysCollection = collections.find(col => col.name === 'bookingkeys');
    if (!bookingKeysCollection) {
      console.log('\nNo bookingkeys collection found in test database');
      return;
    }
    
    // Get all booking keys
    const bookingKeys = await BookingKey.find({}).sort({ createdAt: 1 });
    console.log(`\nFound ${bookingKeys.length} booking keys in test database:`);
    
    bookingKeys.forEach((key, index) => {
      console.log(`${index + 1}. Name: "${key.name}", Category: "${key.category}", Created: ${key.createdAt}`);
    });
    
    // Check for the original keys mentioned by the user
    const originalKeys = [
      'Temporary Staff Booking',
      'Staff member not yet ready', 
      'HR - I cant remember the exact wording',
      'staff sickness',
      'AWOL',
      'temp team member half day'
    ];
    
    console.log('\nChecking for original booking keys:');
    originalKeys.forEach(originalKey => {
      const found = bookingKeys.find(key => 
        key.name.toLowerCase().includes(originalKey.toLowerCase()) ||
        originalKey.toLowerCase().includes(key.name.toLowerCase())
      );
      if (found) {
        console.log(`✓ Found match for "${originalKey}": "${found.name}"`);
      } else {
        console.log(`✗ No match found for "${originalKey}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkTestDatabaseKeys();