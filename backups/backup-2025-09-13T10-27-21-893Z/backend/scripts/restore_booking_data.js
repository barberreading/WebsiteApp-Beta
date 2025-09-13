const mongoose = require('mongoose');
const { BookingKey, LocationArea } = require('./models/BookingCategories');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/staff_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample booking keys data
const sampleBookingKeys = [
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
const sampleLocationAreas = [
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
    console.log('Connecting to database...');
    
    // Clear existing data
    await BookingKey.deleteMany({});
    await LocationArea.deleteMany({});
    console.log('Cleared existing booking data');
    
    // Insert booking keys
    const createdKeys = await BookingKey.insertMany(sampleBookingKeys);
    console.log(`Created ${createdKeys.length} booking keys:`);
    createdKeys.forEach(key => {
      console.log(`- ${key.name}: ${key.description}`);
    });
    
    // Insert location areas
    const createdAreas = await LocationArea.insertMany(sampleLocationAreas);
    console.log(`\nCreated ${createdAreas.length} location areas:`);
    createdAreas.forEach(area => {
      console.log(`- ${area.name}: ${area.description}`);
    });
    
    console.log('\nBooking data restoration completed successfully!');
    
  } catch (error) {
    console.error('Error restoring booking data:', error);
  } finally {
    mongoose.disconnect();
  }
}

restoreBookingData();