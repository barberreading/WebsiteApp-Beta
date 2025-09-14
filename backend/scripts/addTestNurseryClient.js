const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import the Client model
const Client = require('../models/Client');

async function addTestNurseryClient() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('Connected to MongoDB');

    // Check if 'test nursery' client already exists
    const existingClient = await Client.findOne({ 
      $or: [
        { name: /test nursery/i },
        { firstName: /test/i, lastName: /nursery/i }
      ]
    });

    if (existingClient) {
      logger.log('Test nursery client already exists:', existingClient.name);
      return;
    }

    // Create the test nursery client
    const testNurseryClient = new Client({
      name: 'Test Nursery',
      firstName: 'Test',
      lastName: 'Nursery',
      email: 'contact@testnursery.com',
      phone: '07700 900999',
      address: '123 Test Street',
      city: 'Test City',
      postcode: 'TE5T 1NG',
      notes: 'Test nursery client - restored from user data'
    });

    await testNurseryClient.save();
    logger.log('Successfully added Test Nursery client:', testNurseryClient.name);
    logger.log('Client ID:', testNurseryClient._id);

  } catch (error) {
    logger.error('Error adding test nursery client:', error);
  } finally {
    await mongoose.connection.close();
    logger.log('Database connection closed');
  }
}

addTestNurseryClient();