const axios = require('axios');

async function testAPI() {
  const adminEmail = process.env.ADMIN_EMAIL || 'barberreading@hotmail.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for authentication');
  }
  
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    
    const token = loginResponse.data.token;
    logger.log('Login successful');
    
    // Test the booking alerts endpoint
    const alertsResponse = await axios.get('http://localhost:3002/api/booking-alerts/available', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    logger.log('\n=== BOOKING ALERTS TEST RESULTS ===');
    logger.log(`Status: ${alertsResponse.status}`);
    logger.log(`Visible alerts count: ${alertsResponse.data.count}`);
    logger.log(`Total alerts in response: ${alertsResponse.data.data ? alertsResponse.data.data.length : 0}`);
    
    if (alertsResponse.data.data && alertsResponse.data.data.length > 0) {
      logger.log('\nAlert titles:');
      alertsResponse.data.data.forEach((alert, index) => {
        logger.log(`  ${index + 1}. ${alert.title} (Status: ${alert.status}, SendToAll: ${alert.sendToAll})`);
      });
    }
    
  } catch (error) {
    logger.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAPI();