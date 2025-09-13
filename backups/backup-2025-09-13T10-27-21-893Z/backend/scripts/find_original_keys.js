const mongoose = require('mongoose');
require('dotenv').config();
const { BookingKey } = require('./models/BookingCategories');

async function findOriginalKeys() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const keys = await BookingKey.find({}).sort({createdAt: 1});
    
    console.log('\n=== ALL BOOKING KEYS (sorted by creation date) ===');
    keys.forEach((key, index) => {
      const createdDate = new Date(key.createdAt);
      const isOld = createdDate < new Date('2025-09-07');
      console.log(`${index + 1}. "${key.name}" (Created: ${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}) ${isOld ? '[ORIGINAL]' : '[RECENT]'}`);
    });
    
    console.log('\n=== ORIGINAL KEYS (created before Sept 7, 2025) ===');
    const originalKeys = keys.filter(key => new Date(key.createdAt) < new Date('2025-09-07'));
    if (originalKeys.length === 0) {
      console.log('No original keys found - they may have been deleted or replaced');
    } else {
      originalKeys.forEach((key, index) => {
        console.log(`${index + 1}. "${key.name}" - ${key.description}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findOriginalKeys();