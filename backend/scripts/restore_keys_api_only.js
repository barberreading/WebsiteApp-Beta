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
  const adminEmail = process.env.ADMIN_EMAIL || 'andrew@everythingchildcareagency.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for authentication');
  }
  
  try {
    logger.log('Attempting to login as admin user...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: adminPassword
    });
    return response.data.token;
  } catch (error) {
    throw new Error(`Admin login failed: ${error.response?.data?.msg || error.message}`);
  }
}

async function restoreBookingKeys(token) {
  logger.log('\nRestoring booking keys...');
  
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
      logger.log(`✅ Created booking key: ${keyData.name}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        logger.log(`ℹ️  Booking key already exists: ${keyData.name}`);
      } else {
        logger.log(`❌ Failed to create booking key ${keyData.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function restoreLocationAreas(token) {
  logger.log('\nRestoring location areas...');
  
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
      logger.log(`✅ Created location area: ${areaData.name}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        logger.log(`ℹ️  Location area already exists: ${areaData.name}`);
      } else {
        logger.log(`❌ Failed to create location area ${areaData.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function verifyData(token) {
  logger.log('\nVerifying restored data...');
  
  try {
    const keysResponse = await axios.get(`${BASE_URL}/api/booking-categories/keys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logger.log(`📊 Total booking keys: ${keysResponse.data.length}`);
    
    const areasResponse = await axios.get(`${BASE_URL}/api/booking-categories/areas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logger.log(`📊 Total location areas: ${areasResponse.data.length}`);
    
  } catch (error) {
    logger.log('❌ Failed to verify data:', error.response?.data?.message || error.message);
  }
}

async function restoreData() {
  try {
    const token = await loginAsAdmin();
    logger.log('✅ Successfully authenticated');
    
    await restoreBookingKeys(token);
    await restoreLocationAreas(token);
    await verifyData(token);
    
    logger.log('\n🎉 Booking keys and location areas restoration completed!');
  } catch (error) {
    logger.log('❌ Restoration failed:', error.message);
  }
}

restoreData();