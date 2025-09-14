const axios = require('axios');
const mongoose = require('mongoose');

// Sample data to restore
const sampleKeys = [
  { name: 'Standard Appointment', description: 'Regular scheduled appointment' },
  { name: 'Emergency Call', description: 'Urgent emergency service call' },
  { name: 'Consultation', description: 'Initial consultation meeting' },
  { name: 'Follow-up', description: 'Follow-up appointment or service' },
  { name: 'Maintenance', description: 'Routine maintenance service' },
  { name: 'Installation', description: 'New installation service' },
  { name: 'Repair', description: 'Repair service call' },
  { name: 'Assessment', description: 'Assessment or evaluation service' }
];

const sampleAreas = [
  { name: 'North Zone', description: 'Northern service area' },
  { name: 'South Zone', description: 'Southern service area' },
  { name: 'East Zone', description: 'Eastern service area' },
  { name: 'West Zone', description: 'Western service area' },
  { name: 'Central Zone', description: 'Central service area' },
  { name: 'Commercial District', description: 'Commercial business area' },
  { name: 'Residential Area', description: 'Residential service area' },
  { name: 'Industrial Zone', description: 'Industrial service area' }
];

async function loginAsAdmin() {
  try {
    // First, let's connect to MongoDB to find an admin user
    await mongoose.connect('mongodb://localhost:27017/test');
    logger.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const adminUser = await User.findOne({ role: { $in: ['admin', 'superuser'] } });
    
    if (!adminUser) {
      logger.log('No admin user found. Creating a temporary admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('temppass123', salt);
      
      const tempAdmin = new User({
        name: 'Temp Admin',
        email: 'temp@admin.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await tempAdmin.save();
      logger.log('Temporary admin user created');
      
      // Login with temp admin
      const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
        email: 'temp@admin.com',
        password: 'temppass123'
      });
      
      return loginResponse.data.token;
    } else {
      logger.log(`Found admin user: ${adminUser.email}`);
      // For existing admin, we'll need to reset password temporarily
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('temppass123', salt);
      
      adminUser.password = hashedPassword;
      await adminUser.save();
      
      logger.log('Temporarily reset admin password');
      
      // Login with admin
      const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
        email: adminUser.email,
        password: 'temppass123'
      });
      
      return loginResponse.data.token;
    }
  } catch (error) {
    logger.error('Login error:', error.message);
    throw error;
  }
}

async function restoreData() {
  try {
    logger.log('Getting admin authentication...');
    const token = await loginAsAdmin();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    logger.log('\nRestoring booking keys...');
    for (const key of sampleKeys) {
      try {
        const response = await axios.post('http://localhost:3002/api/booking-categories/keys', key, { headers });
        logger.log(`✓ Created key: ${key.name}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
          logger.log(`- Key already exists: ${key.name}`);
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
          logger.log(`- Area already exists: ${area.name}`);
        } else {
          logger.log(`✗ Error creating area '${area.name}': ${err.response?.data?.message || err.message}`);
        }
      }
    }

    logger.log('\n🎉 Data restoration completed!');

    // Verify the data
    logger.log('\nVerifying restored data...');
    try {
      const keysResponse = await axios.get('http://localhost:3002/api/booking-categories/keys', { headers });
      logger.log(`Found ${keysResponse.data.data.length} booking keys`);
      
      const areasResponse = await axios.get('http://localhost:3002/api/booking-categories/areas', { headers });
      logger.log(`Found ${areasResponse.data.data.length} location areas`);
    } catch (err) {
      logger.log('Error verifying data:', err.response?.data?.message || err.message);
    }

  } catch (error) {
    logger.error('Restoration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('\nDisconnected from MongoDB');
  }
}

restoreData();