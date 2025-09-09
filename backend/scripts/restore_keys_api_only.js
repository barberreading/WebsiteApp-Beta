const axios = require('axios');

// Sample booking keys data
const bookingKeysData = [
  { name: 'Nursery', description: 'Nursery bookings' },
  { name: 'Nanny', description: 'Nanny bookings' },
  { name: 'Babysitter', description: 'Babysitter bookings' },
  { name: 'Maternity Nurse', description: 'Maternity nurse bookings' },
  { name: 'Emergency Care', description: 'Emergency childcare bookings' }
];

// Sample location areas data
const locationAreasData = [
  { name: 'London Central', description: 'Central London area' },
  { name: 'London North', description: 'North London area' },
  { name: 'London South', description: 'South London area' },
  { name: 'London East', description: 'East London area' },
  { name: 'London West', description: 'West London area' },
  { name: 'Greater London', description: 'Greater London area' },
  { name: 'Home Counties', description: 'Areas surrounding London' }
];

const BASE_URL = 'http://localhost:3002';

async function loginAsAdmin() {
  try {
    console.log('Attempting to login as Andrew (superuser)...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'andrew@everythingchildcareagency.co.uk',
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    console.log('Andrew login failed, trying default password...');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'andrew@everythingchildcareagency.co.uk',
        password: 'admin123'
      });
      return response.data.token;
    } catch (superError) {
      throw new Error('Andrew login failed with both passwords');
    }
  }
}

async function restoreBookingKeys(token) {
  console.log('\nRestoring booking keys...');
  
  for (const keyData of bookingKeysData) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/booking-categories/keys`,
        keyData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Created booking key: ${keyData.name}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  Booking key already exists: ${keyData.name}`);
      } else {
        console.log(`❌ Failed to create booking key ${keyData.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function restoreLocationAreas(token) {
  console.log('\nRestoring location areas...');
  
  for (const areaData of locationAreasData) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/booking-categories/areas`,
        areaData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Created location area: ${areaData.name}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  Location area already exists: ${areaData.name}`);
      } else {
        console.log(`❌ Failed to create location area ${areaData.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function verifyData(token) {
  console.log('\nVerifying restored data...');
  
  try {
    const keysResponse = await axios.get(`${BASE_URL}/api/booking-categories/keys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`📊 Total booking keys: ${keysResponse.data.length}`);
    
    const areasResponse = await axios.get(`${BASE_URL}/api/booking-categories/areas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`📊 Total location areas: ${areasResponse.data.length}`);
    
  } catch (error) {
    console.log('❌ Failed to verify data:', error.response?.data?.message || error.message);
  }
}

async function restoreData() {
  try {
    const token = await loginAsAdmin();
    console.log('✅ Successfully authenticated');
    
    await restoreBookingKeys(token);
    await restoreLocationAreas(token);
    await verifyData(token);
    
    console.log('\n🎉 Booking keys and location areas restoration completed!');
  } catch (error) {
    console.log('❌ Restoration failed:', error.message);
  }
}

restoreData();