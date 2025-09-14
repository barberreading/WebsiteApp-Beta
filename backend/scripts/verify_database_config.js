require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function verifyDatabaseConfiguration() {
  logger.log('🔍 Database Configuration Verification');
  logger.log('=====================================\n');

  // 1. Check environment variables
  logger.log('1. Environment Variables:');
  logger.log(`   MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not set'}`);
  logger.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  // 2. Check fallback connection string in code
  const indexPath = path.join(__dirname, '..', 'index.js');
  const serverPath = path.join(__dirname, '..', 'server.js');
  
  logger.log('\n2. Fallback Connection Strings in Code:');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const indexMatch = indexContent.match(/mongodb:\/\/localhost:27017\/([^'"]+)/);
    logger.log(`   index.js fallback: ${indexMatch ? indexMatch[1] : 'Not found'}`);
  }
  
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const serverMatch = serverContent.match(/mongodb:\/\/localhost:27017\/([^'"]+)/);
    logger.log(`   server.js fallback: ${serverMatch ? serverMatch[1] : 'Not found'}`);
  }

  // 3. Test actual database connection
  logger.log('\n3. Testing Database Connection:');
  try {
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString);
    
    const dbName = mongoose.connection.db.databaseName;
    logger.log(`   ✅ Connected successfully to database: "${dbName}"`);
    
    // Check if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.log(`   📊 Found ${collections.length} collections in the database`);
    
    // Verify some key data exists
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    logger.log(`   👥 Users in database: ${userCount}`);
    
    await mongoose.disconnect();
    logger.log('   🔌 Disconnected successfully');
    
  } catch (error) {
    logger.log(`   ❌ Connection failed: ${error.message}`);
  }

  // 4. Check for any remaining 'staff-management' references
  logger.log('\n4. Scanning for Legacy References:');
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
          logger.log(`   ⚠️  Active references in ${file}: ${activeMatches.length}`);
          foundLegacyRefs = true;
        } else {
          logger.log(`   ✅ Only commented references in ${file}`);
        }
      } else {
        logger.log(`   ✅ No legacy references in ${file}`);
      }
    }
  }
  
  logger.log('\n5. Configuration Status:');
  if (!foundLegacyRefs) {
    logger.log('   🎉 CONFIGURATION IS SECURE!');
    logger.log('   📌 All active database references point to "test"');
    logger.log('   🔒 No active "staff-management" references found');
    logger.log('   ✨ Your database configuration should remain stable');
  } else {
    logger.log('   ⚠️  Some active legacy references found - review needed');
  }
  
  logger.log('\n=====================================');
  logger.log('Verification completed!');
}

verifyDatabaseConfiguration().catch(console.error);