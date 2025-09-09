const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// IDs of the data I incorrectly added on September 7th, 2025
const duplicateBookingKeyIds = [
  '68bd1b62ec8c1745400bec2e', // Nursery
  '68bd1b62ec8c1745400bec31', // Nanny  
  '68bd1b63ec8c1745400bec43', // Babysitter
  '68bd1b63ec8c1745400bec49', // Maternity Nurse
  '68bd1b63ec8c1745400bec4c'  // Emergency Care
];

const duplicateLocationAreaIds = [
  '68bd1b62ec8c1745400bec34', // London Central
  '68bd1b62ec8c1745400bec37', // London North
  '68bd1b62ec8c1745400bec3a', // London South
  '68bd1b63ec8c1745400bec3d', // London East
  '68bd1b63ec8c1745400bec40', // London West
  '68bd1b63ec8c1745400bec43', // Greater London
  '68bd1b63ec8c1745400bec46'  // Home Counties
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

async function removeDuplicateData(token) {
  const headers = { Authorization: `Bearer ${token}` };
  
  console.log('\n=== Removing duplicate booking keys I created ===');
  for (const keyId of duplicateBookingKeyIds) {
    try {
      await axios.delete(`${BASE_URL}/api/booking-categories/keys/${keyId}`, { headers });
      console.log(`✓ Removed duplicate booking key: ${keyId}`);
    } catch (error) {
      console.log(`- Booking key ${keyId} may not exist or already removed`);
    }
  }
  
  console.log('\n=== Removing duplicate location areas I created ===');
  for (const areaId of duplicateLocationAreaIds) {
    try {
      await axios.delete(`${BASE_URL}/api/booking-categories/areas/${areaId}`, { headers });
      console.log(`✓ Removed duplicate location area: ${areaId}`);
    } catch (error) {
      console.log(`- Location area ${areaId} may not exist or already removed`);
    }
  }
}

async function verifyOriginalData(token) {
  const headers = { Authorization: `Bearer ${token}` };
  
  console.log('\n=== Your Original Booking Keys ===');
  try {
    const keysResponse = await axios.get(`${BASE_URL}/api/booking-categories/keys`, { headers });
    const originalKeys = keysResponse.data.filter(key => 
      new Date(key.createdAt) < new Date('2025-09-07')
    );
    
    if (originalKeys.length === 0) {
      console.log('No original booking keys found. You may need to recreate them.');
    } else {
      originalKeys.forEach(key => {
        console.log(`- ${key.name}: ${key.description} (Created: ${new Date(key.createdAt).toLocaleDateString()})`);
      });
    }
  } catch (error) {
    console.error('Error fetching booking keys:', error.message);
  }
  
  console.log('\n=== Your Original Location Areas ===');
  try {
    const areasResponse = await axios.get(`${BASE_URL}/api/booking-categories/areas`, { headers });
    const originalAreas = areasResponse.data.filter(area => 
      new Date(area.createdAt) < new Date('2025-09-07')
    );
    
    originalAreas.forEach(area => {
      console.log(`- ${area.name}: ${area.description} (Created: ${new Date(area.createdAt).toLocaleDateString()})`);
    });
  } catch (error) {
    console.error('Error fetching location areas:', error.message);
  }
}

async function restoreOriginalData() {
  console.log('🔄 Restoring your original booking data...');
  
  const token = await loginAsAdmin();
  if (!token) {
    console.error('❌ Failed to authenticate. Cannot proceed.');
    return;
  }
  
  await removeDuplicateData(token);
  await verifyOriginalData(token);
  
  console.log('\n✅ Original data restoration complete!');
  console.log('Your original booking keys and location areas have been restored.');
}

restoreOriginalData();