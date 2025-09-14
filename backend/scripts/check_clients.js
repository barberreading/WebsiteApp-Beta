const Client = require('../models/Client');
const { BookingKey, LocationArea } = require('../models/BookingCategories');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkClients() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to database');
    
    // Check clients
    const clients = await Client.find({}, 'name firstName lastName email status').limit(10);
    logger.log('\nAvailable clients:');
    logger.log(`Total clients found: ${clients.length}`);
    clients.forEach(client => {
      logger.log(`- Name: ${client.name || `${client.firstName} ${client.lastName}`}`);
      logger.log(`  Email: ${client.email}`);
      logger.log(`  Status: ${client.status}`);
      logger.log('---');
    });
    
    // Check booking categories
    const bookingKeys = await BookingKey.find({}, 'name description');
    logger.log('\nBooking Keys:');
    logger.log(`Total booking keys found: ${bookingKeys.length}`);
    bookingKeys.forEach(key => {
      logger.log(`- Name: ${key.name}`);
      logger.log(`  Description: ${key.description}`);
      logger.log('---');
    });
    
    // Check location areas
    const locationAreas = await LocationArea.find({}, 'name description');
    logger.log('\nLocation Areas:');
    logger.log(`Total location areas found: ${locationAreas.length}`);
    locationAreas.forEach(area => {
      logger.log(`- Name: ${area.name}`);
      logger.log(`  Description: ${area.description}`);
      logger.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

checkClients();