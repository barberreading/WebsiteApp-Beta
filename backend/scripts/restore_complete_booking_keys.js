const axios = require('axios');

// Complete original booking keys data based on codebase references
const originalBookingKeysData = [
  { name: 'Nursery', description: 'Nursery bookings' },
  { name: 'Nanny', description: 'Nanny bookings' },
  { name: 'Babysitter', description: 'Babysitter bookings' },
  { name: 'Maternity Nurse', description: 'Maternity nurse bookings' },
  { name: 'Emergency Care', description: 'Emergency childcare bookings' },
  { name: 'Temporary staff booking', description: 'Temporary staff assignments' },
  { name: 'Staff sickness', description: 'Staff sickness coverage bookings' },
  { name: 'HR booking', description: 'HR related bookings without clients' },
  { name: 'Emergency staff', description: 'Emergency staff deployment' },
  { name: 'Maternity leave', description: 'Maternity leave coverage' }
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

async function getCurrentBookingKeys(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/booking-categories/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching current booking keys:', error.message);
    return [];
  }
}

async function createBookingKey(token, keyData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/booking-categories/keys`, keyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logger.log(`✓ Created booking key: ${keyData.name}`);
    return response.data;
  } catch (error) {
    logger.error(`✗ Failed to create booking key '${keyData.name}':`, error.response?.data?.message || error.message);
    return null;
  }
}

async function restoreCompleteBookingKeys() {
  try {
    logger.log('=== Restoring Complete Original Booking Keys ===\n');
    
    // Login as admin
    const token = await loginAsAdmin();
    logger.log('✓ Successfully authenticated as Andrew\n');
    
    // Get current booking keys
    logger.log('Checking current booking keys...');
    const currentKeys = await getCurrentBookingKeys(token);
    logger.log(`Found ${currentKeys.length} existing booking keys\n`);
    
    // Create missing booking keys
    logger.log('Creating missing original booking keys...');
    let createdCount = 0;
    
    for (const keyData of originalBookingKeysData) {
      // Check if key already exists
      const existingKey = currentKeys.find(key => key.name.toLowerCase() === keyData.name.toLowerCase());
      
      if (existingKey) {
        logger.log(`- Booking key '${keyData.name}' already exists`);
      } else {
        const result = await createBookingKey(token, keyData);
        if (result) {
          createdCount++;
        }
      }
    }
    
    logger.log(`\n=== Restoration Complete ===`);
    logger.log(`Created ${createdCount} new booking keys`);
    
    // Verify final state
    logger.log('\nFinal verification...');
    const finalKeys = await getCurrentBookingKeys(token);
    logger.log(`Total booking keys now: ${finalKeys.length}`);
    
    logger.log('\nCurrent booking keys:');
    finalKeys.forEach(key => {
      logger.log(`- ${key.name}: ${key.description}`);
    });
    
  } catch (error) {
    logger.error('Error during restoration:', error.message);
  }
}

// Run the restoration
restoreCompleteBookingKeys();