const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Client = require('../models/Client');

const checkClients = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.log('Connected to MongoDB');
    
    // Get all clients
    const clients = await Client.find({}).sort({ createdAt: -1 });
    
    logger.log(`\n=== Total Clients Found: ${clients.length} ===`);
    
    if (clients.length === 0) {
      logger.log('No clients found in the database.');
    } else {
      logger.log('\n=== Client List ===');
      clients.forEach((client, index) => {
        logger.log(`${index + 1}. ${client.name}`);
        logger.log(`   Email: ${client.email}`);
        logger.log(`   Phone: ${client.phone || 'N/A'}`);
        logger.log(`   Created: ${client.createdAt ? client.createdAt.toISOString().split('T')[0] : 'N/A'}`);
        logger.log(`   ID: ${client._id}`);
        logger.log('');
      });
    }
    
    // Check for recently deleted or modified clients
    logger.log('=== Recent Activity Check ===');
    const recentClients = await Client.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 });
    
    logger.log(`Clients created in the last 7 days: ${recentClients.length}`);
    recentClients.forEach(client => {
      logger.log(`- ${client.name} (${client.createdAt.toISOString().split('T')[0]})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Error checking clients:', error);
    process.exit(1);
  }
};

checkClients();