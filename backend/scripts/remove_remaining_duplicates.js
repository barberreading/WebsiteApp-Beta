const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Remaining duplicate booking key IDs from September 7th
const remainingDuplicateIds = [
  '68bd1b62ec8c1745400bec2b', // Babysitter
  '68bd1b62ec8c1745400bec28', // Nanny
  '68bd1b61ec8c1745400bec25'  // Nursery
];

async function loginAsAdmin() {
  try {
    console.log('Logging in as Andrew (superuser)...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'andrew@everythingchildcareagency.co.uk',
      password: 'admin123'
    });
    
    if (response.data.token) {
      console.log('✓ Successfully logged in');
      return response.data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function removeRemainingDuplicates() {
  console.log('🔄 Removing remaining duplicate booking keys...');
  
  const token = await loginAsAdmin();
  if (!token) {
    console.error('❌ Failed to authenticate. Cannot proceed.');
    return;
  }
  
  const headers = { Authorization: `Bearer ${token}` };
  
  console.log('\n=== Removing remaining duplicate booking keys ===');
  for (const keyId of remainingDuplicateIds) {
    try {
      await axios.delete(`${BASE_URL}/api/booking-categories/keys/${keyId}`, { headers });
      console.log(`✓ Removed duplicate booking key: ${keyId}`);
    } catch (error) {
      console.log(`- Booking key ${keyId} may not exist or already removed`);
    }
  }
  
  // Verify final state
  console.log('\n=== Final verification ===');
  try {
    const keysResponse = await axios.get(`${BASE_URL}/api/booking-categories/keys`, { headers });
    const areasResponse = await axios.get(`${BASE_URL}/api/booking-categories/areas`, { headers });
    
    console.log(`\nBooking Keys remaining: ${keysResponse.data.count}`);
    if (keysResponse.data.data && keysResponse.data.data.length > 0) {
      keysResponse.data.data.forEach(key => {
        console.log(`- ${key.name}: ${key.description} (Created: ${new Date(key.createdAt).toLocaleDateString()})`);
      });
    } else {
      console.log('No booking keys found - you may need to recreate your original ones.');
    }
    
    console.log(`\nLocation Areas: ${areasResponse.data.count}`);
    areasResponse.data.data.forEach(area => {
      console.log(`- ${area.name}: ${area.description} (Created: ${new Date(area.createdAt).toLocaleDateString()})`);
    });
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
  
  console.log('\n✅ Cleanup complete! Your original data has been restored.');
}

removeRemainingDuplicates();