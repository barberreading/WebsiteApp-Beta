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
    logger.log('Connecting to MongoDB...');
    logger.log('Database URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB successfully');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    logger.log('Connected to database:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.log('\nAvailable collections:');
    collections.forEach(col => logger.log(`- ${col.name}`));
    
    // Check if bookingkeys collection exists
    const bookingKeysCollection = collections.find(col => col.name === 'bookingkeys');
    if (!bookingKeysCollection) {
      logger.log('\nNo bookingkeys collection found in test database');
      return;
    }
    
    // Get all booking keys
    const bookingKeys = await BookingKey.find({}).sort({ createdAt: 1 });
    logger.log(`\nFound ${bookingKeys.length} booking keys in test database:`);
    
    bookingKeys.forEach((key, index) => {
      logger.log(`${index + 1}. Name: "${key.name}", Category: "${key.category}", Created: ${key.createdAt}`);
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
    
    logger.log('\nChecking for original booking keys:');
    originalKeys.forEach(originalKey => {
      const found = bookingKeys.find(key => 
        key.name.toLowerCase().includes(originalKey.toLowerCase()) ||
        originalKey.toLowerCase().includes(key.name.toLowerCase())
      );
      if (found) {
        logger.log(`✓ Found match for "${originalKey}": "${found.name}"`);
      } else {
        logger.log(`✗ No match found for "${originalKey}"`);
      }
    });
    
  } catch (error) {
    logger.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('\nDisconnected from MongoDB');
  }
}

checkTestDatabaseKeys();