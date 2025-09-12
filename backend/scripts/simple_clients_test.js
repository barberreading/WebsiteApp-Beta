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
    console.log('Testing clients API...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    
    console.log('✓ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };
    
    // Test clients endpoint
    const clientsResponse = await axios.get('http://localhost:3002/api/clients', { headers });
    console.log('✓ Clients API response received');
    
    // Handle both array and object response formats
    const clientsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : clientsResponse.data.data;
    
    if (clientsData && Array.isArray(clientsData)) {
      console.log(`Found ${clientsData.length} clients:`);
      clientsData.forEach(client => {
        console.log(`- ${client.name} (${client.email})`);
      });
      
      // Look for Test Nursery
      const testNursery = clientsData.find(client => 
        client.name === 'Test Nursery' && client.email === 'everythingchildcare@gmail.com'
      );
      
      if (testNursery) {
        console.log('✓ Test Nursery found!');
        console.log('  ID:', testNursery._id);
        console.log('  Status:', testNursery.status);
      } else {
        console.log('✗ Test Nursery not found');
      }
    } else {
      console.log('Unexpected response format:', typeof clientsResponse.data);
      console.log('Response data:', clientsResponse.data);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

testClientsAPI();