const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.log('MongoDB Connected'))
.catch(err => {
  logger.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Sample user data
const sampleUsers = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    services: ['Childcare', 'Tutoring'],
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Michael Smith',
    email: 'michael.smith@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    services: ['Childcare', 'Special Needs Support'],
    workingHours: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Lisa Davis',
    email: 'lisa.davis@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/55.jpg',
    services: ['Childcare', 'Homework Help'],
    workingHours: {
      monday: { start: '10:00', end: '18:00', available: true },
      tuesday: { start: '10:00', end: '18:00', available: true },
      wednesday: { start: '10:00', end: '18:00', available: true },
      thursday: { start: '10:00', end: '18:00', available: true },
      friday: { start: '10:00', end: '18:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/67.jpg',
    services: ['Tutoring', 'Music Lessons'],
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Rachel Green',
    email: 'rachel.green@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/33.jpg',
    services: ['Childcare', 'Art Classes'],
    workingHours: {
      monday: { start: '08:30', end: '16:30', available: true },
      tuesday: { start: '08:30', end: '16:30', available: true },
      wednesday: { start: '08:30', end: '16:30', available: true },
      thursday: { start: '08:30', end: '16:30', available: true },
      friday: { start: '08:30', end: '16:30', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/78.jpg',
    services: ['Sports Coaching', 'Childcare'],
    workingHours: {
      monday: { start: '07:00', end: '15:00', available: true },
      tuesday: { start: '07:00', end: '15:00', available: true },
      wednesday: { start: '07:00', end: '15:00', available: true },
      thursday: { start: '07:00', end: '15:00', available: true },
      friday: { start: '07:00', end: '15:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Amy Roberts',
    email: 'amy.roberts@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/89.jpg',
    services: ['Language Tutoring', 'Childcare'],
    workingHours: {
      monday: { start: '11:00', end: '19:00', available: true },
      tuesday: { start: '11:00', end: '19:00', available: true },
      wednesday: { start: '11:00', end: '19:00', available: true },
      thursday: { start: '11:00', end: '19:00', available: true },
      friday: { start: '11:00', end: '19:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Oliver Thompson',
    email: 'oliver.thompson@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/45.jpg',
    services: ['Childcare', 'Swimming Lessons'],
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Charlotte Evans',
    email: 'charlotte.evans@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/67.jpg',
    services: ['Childcare', 'Dance Classes'],
    workingHours: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Benjamin Clark',
    email: 'benjamin.clark@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/56.jpg',
    services: ['Tutoring', 'Science Labs'],
    workingHours: {
      monday: { start: '10:00', end: '18:00', available: true },
      tuesday: { start: '10:00', end: '18:00', available: true },
      wednesday: { start: '10:00', end: '18:00', available: true },
      thursday: { start: '10:00', end: '18:00', available: true },
      friday: { start: '10:00', end: '18:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Isabella Martinez',
    email: 'isabella.martinez@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/women/78.jpg',
    services: ['Childcare', 'Cooking Classes'],
    workingHours: {
      monday: { start: '07:30', end: '15:30', available: true },
      tuesday: { start: '07:30', end: '15:30', available: true },
      wednesday: { start: '07:30', end: '15:30', available: true },
      thursday: { start: '07:30', end: '15:30', available: true },
      friday: { start: '07:30', end: '15:30', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Alexander Lee',
    email: 'alexander.lee@everythingchildcareagency.co.uk',
    password: 'Staff123!',
    role: 'staff',
    photo: 'https://randomuser.me/api/portraits/men/89.jpg',
    services: ['Childcare', 'Drama Classes'],
    workingHours: {
      monday: { start: '11:30', end: '19:30', available: true },
      tuesday: { start: '11:30', end: '19:30', available: true },
      wednesday: { start: '11:30', end: '19:30', available: true },
      thursday: { start: '11:30', end: '19:30', available: true },
      friday: { start: '11:30', end: '19:30', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: '', end: '', available: false }
    }
  },
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@everythingchildcareagency.co.uk',
    password: 'Manager123!',
    role: 'manager',
    photo: 'https://randomuser.me/api/portraits/women/22.jpg'
  },
  {
    name: 'David Brown',
    email: 'david.brown@everythingchildcareagency.co.uk',
    password: 'Admin123!',
    role: 'admin',
    photo: 'https://randomuser.me/api/portraits/men/41.jpg'
  }
];

// Sample client data
const sampleClients = [
  {
    firstName: 'Jennifer',
    lastName: 'Parker',
    email: 'jennifer.parker@example.com',
    phone: '07700 900123',
    address: {
      street: '42 Oak Avenue',
      city: 'Manchester',
      postalCode: 'M1 2WX',
      country: 'UK'
    },
    notes: 'Requires childcare services for two children aged 5 and 7.'
  },
  {
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@example.com',
    phone: '07700 900456',
    address: {
      street: '15 Elm Street',
      city: 'Birmingham',
      postalCode: 'B1 1AA',
      country: 'UK'
    },
    notes: 'Looking for tutoring services for GCSE preparation.'
  },
  {
    firstName: 'Sophia',
    lastName: 'Williams',
    email: 'sophia.williams@example.com',
    phone: '07700 900789',
    address: {
      street: '8 Pine Road',
      city: 'London',
      postalCode: 'SW1A 1AA',
      country: 'UK'
    },
    notes: 'Needs special needs support for 10-year-old son with autism.'
  },
  {
    firstName: 'James',
    lastName: 'Miller',
    email: 'james.miller@example.com',
    phone: '07700 900234',
    address: {
      street: '27 Maple Drive',
      city: 'Leeds',
      postalCode: 'LS1 1UR',
      country: 'UK'
    },
    notes: 'Requires after-school care for three children.'
  },
  {
    firstName: 'Olivia',
    lastName: 'Jones',
    email: 'olivia.jones@example.com',
    phone: '07700 900567',
    address: {
      street: '53 Cedar Lane',
      city: 'Glasgow',
      postalCode: 'G1 1XD',
      country: 'UK'
    },
    notes: 'Looking for weekend childcare services.'
  }
];

// Add sample users
const addSampleUsers = async () => {
  try {
    // Clear existing users except superuser
    await User.deleteMany({ role: { $ne: 'superuser' } });
    
    // Add new sample users
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        ...userData,
        password: hashedPassword,
        consentGiven: true
      });
    }
    
    logger.log('Sample users added successfully');
  } catch (err) {
    logger.error('Error adding sample users:', err);
  }
};

// Add sample clients
const addSampleClients = async () => {
  try {
    // Clear existing clients
    await Client.deleteMany({});
    
    // Add new sample clients
    await Client.insertMany(sampleClients);
    
    logger.log('Sample clients added successfully');
  } catch (err) {
    logger.error('Error adding sample clients:', err);
  }
};

// Run the functions
const addAllSampleData = async () => {
  await addSampleUsers();
  await addSampleClients();
  logger.log('All sample data added successfully');
  process.exit(0);
};

addAllSampleData();