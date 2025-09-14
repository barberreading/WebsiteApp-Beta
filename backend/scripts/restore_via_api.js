const axios = require('axios');

// Sample booking keys data
const sampleKeys = [
  {
    name: 'Standard Appointment',
    description: 'Regular scheduled appointment'
  },
  {
    name: 'Emergency Call',
    description: 'Urgent emergency service call'
  },
  {
    name: 'Consultation',
    description: 'Initial consultation meeting'
  },
  {
    name: 'Follow-up',
    description: 'Follow-up appointment'
  },
  {
    name: 'Maintenance',
    description: 'Routine maintenance service'
  },
  {
    name: 'Installation',
    description: 'New installation service'
  },
  {
    name: 'Repair',
    description: 'Repair service call'
  },
  {
    name: 'Assessment',
    description: 'Property or service assessment'
  }
];

// Sample location areas data
const sampleAreas = [
  {
    name: 'North Zone',
    description: 'Northern service area'
  },
  {
    name: 'South Zone',
    description: 'Southern service area'
  },
  {
    name: 'East Zone',
    description: 'Eastern service area'
  },
  {
    name: 'West Zone',
    description: 'Western service area'
  },
  {
    name: 'Central Zone',
    description: 'Central service area'
  },
  {
    name: 'Commercial District',
    description: 'Commercial and business area'
  },
  {
    name: 'Residential Area',
    description: 'Residential neighborhoods'
  },
  {
    name: 'Industrial Zone',
    description: 'Industrial and warehouse area'
  }
];

async function restoreBookingData() {
  try {
    // Use a valid admin token - you may need to update this
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzZhNzNhNzY4YzE4MzY4NzI5NzY4YSIsInJvbGUiOiJzdXBlcnVzZXIiLCJpYXQiOjE3MzU4NzQ0MjYsImV4cCI6MTczNTk2MDgyNn0.Oa8Qs8Qs8Qs8Qs8Qs8Qs8Qs8Qs8Qs8Qs8Qs8Qs8';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    logger.log('Restoring booking keys...');
    
    for (const key of sampleKeys) {
      try {
        const response = await axios.post('http://localhost:3002/api/booking-categories/keys', key, { headers });
        logger.log(`✓ Created key: ${key.name}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
          logger.log(`- Key '${key.name}' already exists`);
        } else {
          logger.log(`✗ Error creating key '${key.name}': ${err.response?.data?.message || err.message}`);
        }
      }
    }
    
    logger.log('\nRestoring location areas...');
    
    for (const area of sampleAreas) {
      try {
        const response = await axios.post('http://localhost:3002/api/booking-categories/areas', area, { headers });
        logger.log(`✓ Created area: ${area.name}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
          logger.log(`- Area '${area.name}' already exists`);
        } else {
          logger.log(`✗ Error creating area '${area.name}': ${err.response?.data?.message || err.message}`);
        }
      }
    }
    
    logger.log('\n🎉 Data restoration completed!');
    
    // Verify the data was created
    logger.log('\nVerifying restored data...');
    try {
      const keysResponse = await axios.get('http://localhost:3002/api/booking-categories/keys', { headers });
      logger.log(`Found ${keysResponse.data.data.length} booking keys`);
      
      const areasResponse = await axios.get('http://localhost:3002/api/booking-categories/areas', { headers });
      logger.log(`Found ${areasResponse.data.data.length} location areas`);
    } catch (err) {
      logger.log('Error verifying data:', err.message);
    }
    
  } catch (error) {
    logger.error('Error during restoration:', error.message);
  }
}

restoreBookingData();