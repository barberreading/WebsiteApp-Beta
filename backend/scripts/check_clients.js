const Client = require('../models/Client');
const { BookingKey, LocationArea } = require('../models/BookingCategories');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkClients() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Check clients
    const clients = await Client.find({}, 'name firstName lastName email status').limit(10);
    console.log('\nAvailable clients:');
    console.log(`Total clients found: ${clients.length}`);
    clients.forEach(client => {
      console.log(`- Name: ${client.name || `${client.firstName} ${client.lastName}`}`);
      console.log(`  Email: ${client.email}`);
      console.log(`  Status: ${client.status}`);
      console.log('---');
    });
    
    // Check booking categories
    const bookingKeys = await BookingKey.find({}, 'name description');
    console.log('\nBooking Keys:');
    console.log(`Total booking keys found: ${bookingKeys.length}`);
    bookingKeys.forEach(key => {
      console.log(`- Name: ${key.name}`);
      console.log(`  Description: ${key.description}`);
      console.log('---');
    });
    
    // Check location areas
    const locationAreas = await LocationArea.find({}, 'name description');
    console.log('\nLocation Areas:');
    console.log(`Total location areas found: ${locationAreas.length}`);
    locationAreas.forEach(area => {
      console.log(`- Name: ${area.name}`);
      console.log(`  Description: ${area.description}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkClients();