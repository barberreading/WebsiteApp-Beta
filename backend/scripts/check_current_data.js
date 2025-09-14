const mongoose = require('mongoose');
const { BookingKey, LocationArea } = require('../models/BookingCategories');

async function checkCurrentData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/test');
        logger.log('Connected to database');
        
        logger.log('\n=== CURRENT BOOKING KEYS ===');
        const keys = await BookingKey.find({});
        if (keys.length === 0) {
            logger.log('No booking keys found');
        } else {
            keys.forEach(k => {
                logger.log(`- ${k.name}: ${k.description}`);
            });
        }
        
        logger.log('\n=== CURRENT LOCATION AREAS ===');
        const areas = await LocationArea.find({});
        if (areas.length === 0) {
            logger.log('No location areas found');
        } else {
            areas.forEach(a => {
                logger.log(`- ${a.name}: ${a.description}`);
            });
        }
        
        await mongoose.disconnect();
        logger.log('\nDatabase connection closed');
    } catch (error) {
        logger.error('Error:', error.message);
        process.exit(1);
    }
}

checkCurrentData();