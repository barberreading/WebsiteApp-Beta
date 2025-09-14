const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Client = require('../models/Client');

// Sample client data
const sampleClients = [
  {
    name: 'Jennifer Parker',
    firstName: 'Jennifer',
    lastName: 'Parker',
    email: 'jennifer.parker@example.com',
    phone: '07700 900123',
    address: {
      street: '42 Oak Avenue',
      city: 'Manchester',
      postcode: 'M1 2WX',
      country: 'UK'
    },
    notes: 'Requires childcare services for two children aged 5 and 7.'
  },
  {
    name: 'Robert Taylor',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@example.com',
    phone: '07700 900456',
    address: {
      street: '15 Elm Street',
      city: 'Birmingham',
      postcode: 'B1 1AA',
      country: 'UK'
    },
    notes: 'Looking for tutoring services for GCSE preparation.'
  },
  {
    name: 'Sophia Williams',
    firstName: 'Sophia',
    lastName: 'Williams',
    email: 'sophia.williams@example.com',
    phone: '07700 900789',
    address: {
      street: '8 Pine Road',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'UK'
    },
    notes: 'Needs special needs support for 10-year-old son with autism.'
  },
  {
    name: 'David Brown',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    phone: '07700 900012',
    address: {
      street: '23 Maple Drive',
      city: 'Leeds',
      postcode: 'LS1 4AP',
      country: 'UK'
    },
    notes: 'Elderly care services needed for mother-in-law.'
  },
  {
    name: 'Emma Davis',
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'emma.davis@example.com',
    phone: '07700 900345',
    address: {
      street: '67 Cedar Close',
      city: 'Liverpool',
      postcode: 'L1 8JQ',
      country: 'UK'
    },
    notes: 'Pet sitting services required for weekend trips.'
  }
];

const addSampleClients = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.log('Connected to MongoDB');
    
    // Check if clients already exist
    const existingClients = await Client.find({});
    logger.log(`Found ${existingClients.length} existing clients`);
    
    if (existingClients.length > 0) {
      logger.log('Clients already exist. Skipping sample data creation.');
      process.exit(0);
    }
    
    // Add sample clients
    const result = await Client.insertMany(sampleClients);
    logger.log(`Successfully added ${result.length} sample clients:`);
    
    result.forEach(client => {
      logger.log(`- ${client.firstName} ${client.lastName} (${client.email})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Error adding sample clients:', error);
    process.exit(1);
  }
};

addSampleClients();