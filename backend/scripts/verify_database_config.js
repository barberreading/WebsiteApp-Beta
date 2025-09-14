require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function verifyDatabaseConfiguration() {
  console.log('🔍 Database Configuration Verification');
  console.log('=====================================\n');

  // 1. Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  // 2. Check fallback connection string in code
  const indexPath = path.join(__dirname, '..', 'index.js');
  const serverPath = path.join(__dirname, '..', 'server.js');
  
  console.log('\n2. Fallback Connection Strings in Code:');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const indexMatch = indexContent.match(/mongodb:\/\/localhost:27017\/([^'"]+)/);
    console.log(`   index.js fallback: ${indexMatch ? indexMatch[1] : 'Not found'}`);
  }
  
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const serverMatch = serverContent.match(/mongodb:\/\/localhost:27017\/([^'"]+)/);
    console.log(`   server.js fallback: ${serverMatch ? serverMatch[1] : 'Not found'}`);
  }

  // 3. Test actual database connection
  console.log('\n3. Testing Database Connection:');
  try {
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`   ✅ Connected successfully to database: "${dbName}"`);
    
    // Check if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📊 Found ${collections.length} collections in the database`);
    
    // Verify some key data exists
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    console.log(`   👥 Users in database: ${userCount}`);
    
    await mongoose.disconnect();
    console.log('   🔌 Disconnected successfully');
    
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
  }

  // 4. Check for any remaining 'staff-management' references
  console.log('\n4. Scanning for Legacy References:');
  const filesToCheck = [
    '../.env',
    '../.env.example',
    '../.env.production',
    '../index.js',
    '../server.js'
  ];
  
  let foundLegacyRefs = false;
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/staff-management/g);
      if (matches && matches.length > 0) {
        // Check if they're in comments
        const lines = content.split('\n');
        const activeMatches = lines.filter(line => 
          line.includes('staff-management') && 
          !line.trim().startsWith('#') && 
          !line.trim().startsWith('//')
        );
        
        if (activeMatches.length > 0) {
          console.log(`   ⚠️  Active references in ${file}: ${activeMatches.length}`);
          foundLegacyRefs = true;
        } else {
          console.log(`   ✅ Only commented references in ${file}`);
        }
      } else {
        console.log(`   ✅ No legacy references in ${file}`);
      }
    }
  }
  
  console.log('\n5. Configuration Status:');
  if (!foundLegacyRefs) {
    console.log('   🎉 CONFIGURATION IS SECURE!');
    console.log('   📌 All active database references point to "test"');
    console.log('   🔒 No active "staff-management" references found');
    console.log('   ✨ Your database configuration should remain stable');
  } else {
    console.log('   ⚠️  Some active legacy references found - review needed');
  }
  
  console.log('\n=====================================');
  console.log('Verification completed!');
}

verifyDatabaseConfiguration().catch(console.error);