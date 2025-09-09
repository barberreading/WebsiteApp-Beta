const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Service = require('./models/Service');
require('dotenv').config();

async function fixFormDropdownData() {
  try {
    console.log('🔧 FIXING FORM DROPDOWN DATA ISSUES');
    console.log('=====================================');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`✅ Connected to database: ${mongoose.connection.name}`);
    
    // Fix 1: Ensure all staff users have firstName and lastName fields
    console.log('\n🔧 FIXING STAFF USERS - Adding firstName/lastName fields...');
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users to check`);
    
    for (const staff of staffUsers) {
      let updated = false;
      const updates = {};
      
      // If firstName or lastName is missing, extract from name field
      if (!staff.firstName || !staff.lastName) {
        if (staff.name) {
          const nameParts = staff.name.split(' ');
          if (nameParts.length >= 2) {
            updates.firstName = nameParts[0];
            updates.lastName = nameParts.slice(1).join(' ');
            updated = true;
          } else {
            // Single name, use as firstName
            updates.firstName = staff.name;
            updates.lastName = '';
            updated = true;
          }
        } else {
          // No name at all, use email prefix
          const emailPrefix = staff.email.split('@')[0];
          updates.firstName = emailPrefix;
          updates.lastName = 'User';
          updated = true;
        }
      }
      
      if (updated) {
        await User.findByIdAndUpdate(staff._id, updates);
        console.log(`  ✅ Updated ${staff.email}: ${updates.firstName} ${updates.lastName}`);
      } else {
        console.log(`  ✓ ${staff.email}: Already has firstName/lastName`);
      }
    }
    
    // Fix 2: Check and fix corrupted client data
    console.log('\n🔧 CHECKING CLIENT DATA...');
    const clients = await Client.find({});
    console.log(`Found ${clients.length} clients`);
    
    let corruptedClients = 0;
    for (const client of clients) {
      // Check if client data is corrupted (very long strings, binary data, etc.)
      const clientStr = JSON.stringify(client);
      if (clientStr.length > 10000 || clientStr.includes('\\x') || clientStr.includes('\\u')) {
        corruptedClients++;
        console.log(`  ❌ Corrupted client found: ${client._id} (${clientStr.length} chars)`);
        
        // Try to fix basic fields
        const cleanClient = {
          name: client.name && typeof client.name === 'string' && client.name.length < 100 ? client.name : 'Client Name',
          email: client.email && typeof client.email === 'string' && client.email.includes('@') ? client.email : 'client@example.com',
          phone: client.phone && typeof client.phone === 'string' && client.phone.length < 20 ? client.phone : '',
          address: {
            street: '',
            city: '',
            postcode: '',
            country: 'UK'
          }
        };
        
        await Client.findByIdAndUpdate(client._id, cleanClient);
        console.log(`    ✅ Fixed client: ${cleanClient.name}`);
      }
    }
    
    if (corruptedClients === 0) {
      console.log('  ✅ All client data appears clean');
    }
    
    // Fix 3: Verify services are working
    console.log('\n🔧 CHECKING SERVICES DATA...');
    const services = await Service.find({});
    console.log(`Found ${services.length} services`);
    
    let activeServices = 0;
    services.forEach(service => {
      if (service.isActive !== false) {
        activeServices++;
      }
    });
    console.log(`  ✅ ${activeServices} active services available`);
    
    // Fix 4: Create test data if collections are empty
    if (clients.length === 0) {
      console.log('\n🔧 CREATING TEST CLIENT DATA...');
      const testClients = [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '01234567890',
          address: {
            street: '123 Main Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'UK'
          }
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          phone: '01234567891',
          address: {
            street: '456 High Street',
            city: 'Manchester',
            postcode: 'M1 1AA',
            country: 'UK'
          }
        },
        {
          name: 'Michael Brown',
          email: 'michael.brown@example.com',
          phone: '01234567892',
          address: {
            street: '789 Oak Avenue',
            city: 'Birmingham',
            postcode: 'B1 1AA',
            country: 'UK'
          }
        }
      ];
      
      for (const clientData of testClients) {
        const client = new Client(clientData);
        await client.save();
        console.log(`  ✅ Created test client: ${clientData.name}`);
      }
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check staff with firstName/lastName
    const verifyStaff = await User.find({ role: 'staff' }).select('firstName lastName name email');
    console.log(`\n📊 STAFF USERS (${verifyStaff.length} total):`);
    verifyStaff.forEach(staff => {
      const displayName = staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.name;
      console.log(`  - ${displayName} (${staff.email})`);
    });
    
    // Check clean clients
    const verifyClients = await Client.find({}).select('name email').limit(5);
    console.log(`\n📊 CLIENTS (${verifyClients.length} total, showing first 5):`);
    verifyClients.forEach(client => {
      console.log(`  - ${client.name} (${client.email})`);
    });
    
    // Check services
    const verifyServices = await Service.find({ isActive: { $ne: false } }).select('name').limit(5);
    console.log(`\n📊 SERVICES (showing first 5):`);
    verifyServices.forEach(service => {
      console.log(`  - ${service.name}`);
    });
    
    console.log('\n✅ FORM DROPDOWN DATA FIX COMPLETE!');
    console.log('🎯 All form dropdowns should now work properly');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixFormDropdownData();