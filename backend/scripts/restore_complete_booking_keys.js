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
  try {
    console.log('Attempting to login as Andrew (superuser)...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'andrew@everythingchildcareagency.co.uk',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.log('Andrew login failed, trying alternative password...');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'andrew@everythingchildcareagency.co.uk',
        password: 'password123'
      });
      return response.data.token;
    } catch (superError) {
      throw new Error('Andrew login failed with both passwords');
    }
  }
}

async function getCurrentBookingKeys(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/booking-categories/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching current booking keys:', error.message);
    return [];
  }
}

async function createBookingKey(token, keyData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/booking-categories/keys`, keyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✓ Created booking key: ${keyData.name}`);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to create booking key '${keyData.name}':`, error.response?.data?.message || error.message);
    return null;
  }
}

async function restoreCompleteBookingKeys() {
  try {
    console.log('=== Restoring Complete Original Booking Keys ===\n');
    
    // Login as admin
    const token = await loginAsAdmin();
    console.log('✓ Successfully authenticated as Andrew\n');
    
    // Get current booking keys
    console.log('Checking current booking keys...');
    const currentKeys = await getCurrentBookingKeys(token);
    console.log(`Found ${currentKeys.length} existing booking keys\n`);
    
    // Create missing booking keys
    console.log('Creating missing original booking keys...');
    let createdCount = 0;
    
    for (const keyData of originalBookingKeysData) {
      // Check if key already exists
      const existingKey = currentKeys.find(key => key.name.toLowerCase() === keyData.name.toLowerCase());
      
      if (existingKey) {
        console.log(`- Booking key '${keyData.name}' already exists`);
      } else {
        const result = await createBookingKey(token, keyData);
        if (result) {
          createdCount++;
        }
      }
    }
    
    console.log(`\n=== Restoration Complete ===`);
    console.log(`Created ${createdCount} new booking keys`);
    
    // Verify final state
    console.log('\nFinal verification...');
    const finalKeys = await getCurrentBookingKeys(token);
    console.log(`Total booking keys now: ${finalKeys.length}`);
    
    console.log('\nCurrent booking keys:');
    finalKeys.forEach(key => {
      console.log(`- ${key.name}: ${key.description}`);
    });
    
  } catch (error) {
    console.error('Error during restoration:', error.message);
  }
}

// Run the restoration
restoreCompleteBookingKeys();