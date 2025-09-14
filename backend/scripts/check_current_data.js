const mongoose = require('mongoose');
const { BookingKey, LocationArea } = require('../models/BookingCategories');

async function checkCurrentData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/test');
        console.log('Connected to database');
        
        console.log('\n=== CURRENT BOOKING KEYS ===');
        const keys = await BookingKey.find({});
        if (keys.length === 0) {
            console.log('No booking keys found');
        } else {
            keys.forEach(k => {
                console.log(`- ${k.name}: ${k.description}`);
            });
        }
        
        console.log('\n=== CURRENT LOCATION AREAS ===');
        const areas = await LocationArea.find({});
        if (areas.length === 0) {
            console.log('No location areas found');
        } else {
            areas.forEach(a => {
                console.log(`- ${a.name}: ${a.description}`);
            });
        }
        
        await mongoose.disconnect();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkCurrentData();