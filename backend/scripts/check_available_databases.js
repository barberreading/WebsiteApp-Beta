const mongoose = require('mongoose');
require('dotenv').config();

async function checkAvailableDatabases() {
  try {
    console.log('Checking available databases on MongoDB Atlas...');
    
    // Connect to MongoDB Atlas without specifying a database
    const baseConnectionString = process.env.MONGO_URI.replace('/test?', '/?');
    console.log('Base connection string:', baseConnectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(baseConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected successfully!');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    
    console.log('\n=== AVAILABLE DATABASES ===');
    databases.databases.forEach(db => {
      console.log(`- Database: ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check for common test database names
    const possibleTestDbs = ['test', 'staff-test', 'test-test', 'staff_test', 'test_test'];
    console.log('\n=== CHECKING FOR TEST DATABASES ===');
    
    for (const dbName of possibleTestDbs) {
      const dbExists = databases.databases.find(db => db.name === dbName);
      if (dbExists) {
        console.log(`✅ Found potential test database: ${dbName}`);
        
        // Connect to this database and check collections
        const testDb = mongoose.connection.client.db(dbName);
        const collections = await testDb.listCollections().toArray();
        console.log(`   Collections in ${dbName}:`, collections.map(c => c.name).join(', '));
        
        // Check if it has users
        if (collections.find(c => c.name === 'users')) {
          const userCount = await testDb.collection('users').countDocuments();
          console.log(`   Users in ${dbName}: ${userCount}`);
        }
      } else {
        console.log(`❌ No database found: ${dbName}`);
      }
    }
    
    console.log('\n=== DATABASE CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

checkAvailableDatabases();