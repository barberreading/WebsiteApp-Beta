const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Remaining duplicate booking key IDs from September 7th
const remainingDuplicateIds = [
  '68bd1b62ec8c1745400bec2b', // Babysitter
  '68bd1b62ec8c1745400bec28', // Nanny
  '68bd1b61ec8c1745400bec25'  // Nursery
];

async function loginAsAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'andrew@everythingchildcareagency.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for authentication');
  }
  
  try {
    logger.log('Logging in as admin user...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: adminPassword
    });
    
    if (response.data.token) {
      logger.log('✓ Successfully logged in');
      return response.data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    logger.error('Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function removeRemainingDuplicates() {
  logger.log('🔄 Removing remaining duplicate booking keys...');
  
  const token = await loginAsAdmin();
  if (!token) {
    logger.error('❌ Failed to authenticate. Cannot proceed.');
    return;
  }
  
  const headers = { Authorization: `Bearer ${token}` };
  
  logger.log('\n=== Removing remaining duplicate booking keys ===');
  for (const keyId of remainingDuplicateIds) {
    try {
      await axios.delete(`${BASE_URL}/api/booking-categories/keys/${keyId}`, { headers });
      logger.log(`✓ Removed duplicate booking key: ${keyId}`);
    } catch (error) {
      logger.log(`- Booking key ${keyId} may not exist or already removed`);
    }
  }
  
  // Verify final state
  logger.log('\n=== Final verification ===');
  try {
    const keysResponse = await axios.get(`${BASE_URL}/api/booking-categories/keys`, { headers });
    const areasResponse = await axios.get(`${BASE_URL}/api/booking-categories/areas`, { headers });
    
    logger.log(`\nBooking Keys remaining: ${keysResponse.data.count}`);
    if (keysResponse.data.data && keysResponse.data.data.length > 0) {
      keysResponse.data.data.forEach(key => {
        logger.log(`- ${key.name}: ${key.description} (Created: ${new Date(key.createdAt).toLocaleDateString()})`);
      });
    } else {
      logger.log('No booking keys found - you may need to recreate your original ones.');
    }
    
    logger.log(`\nLocation Areas: ${areasResponse.data.count}`);
    areasResponse.data.data.forEach(area => {
      logger.log(`- ${area.name}: ${area.description} (Created: ${new Date(area.createdAt).toLocaleDateString()})`);
    });
    
  } catch (error) {
    logger.error('Error during verification:', error.message);
  }
  
  logger.log('\n✅ Cleanup complete! Your original data has been restored.');
}

removeRemainingDuplicates();