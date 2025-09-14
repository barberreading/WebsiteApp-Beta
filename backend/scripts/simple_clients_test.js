const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

async function testClientsAPI() {
  const adminEmail = process.env.ADMIN_EMAIL || 'andrew@everythingchildcareagency.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for authentication');
  }
  
  try {
    logger.log('Testing clients API...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    
    logger.log('✓ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };
    
    // Test clients endpoint
    const clientsResponse = await axios.get('http://localhost:3002/api/clients', { headers });
    logger.log('✓ Clients API response received');
    
    // Handle both array and object response formats
    const clientsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : clientsResponse.data.data;
    
    if (clientsData && Array.isArray(clientsData)) {
      logger.log(`Found ${clientsData.length} clients:`);
      clientsData.forEach(client => {
        logger.log(`- ${client.name} (${client.email})`);
      });
      
      // Look for Test Nursery
      const testNursery = clientsData.find(client => 
        client.name === 'Test Nursery' && client.email === 'everythingchildcare@gmail.com'
      );
      
      if (testNursery) {
        logger.log('✓ Test Nursery found!');
        logger.log('  ID:', testNursery._id);
        logger.log('  Status:', testNursery.status);
      } else {
        logger.log('✗ Test Nursery not found');
      }
    } else {
      logger.log('Unexpected response format:', typeof clientsResponse.data);
      logger.log('Response data:', clientsResponse.data);
    }
    
  } catch (error) {
    logger.error('Error:', error.response?.data?.message || error.message);
  }
}

testClientsAPI();