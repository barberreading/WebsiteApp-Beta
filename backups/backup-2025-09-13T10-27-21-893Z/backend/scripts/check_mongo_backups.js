require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongoBackups() {
  try {
    console.log('=== Checking MongoDB Atlas for Backup Data ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas\n');
    
    // Get database instance
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('📋 Available Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    console.log('\n🔍 Checking for backup or historical collections...');
    
    // Look for backup collections
    const backupCollections = collections.filter(col => 
      col.name.includes('backup') || 
      col.name.includes('old') || 
      col.name.includes('archive') ||
      col.name.includes('history')
    );
    
    if (backupCollections.length > 0) {
      console.log('\n📦 Found potential backup collections:');
      backupCollections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('\n❌ No backup collections found');
    }
    
    // Check if there's a bookingkeys collection with historical data
    console.log('\n🔑 Checking BookingKey collection for historical data...');
    
    const BookingKey = mongoose.model('BookingKey', new mongoose.Schema({
      name: String,
      description: String,
      createdAt: Date,
      updatedAt: Date
    }, { timestamps: true }));
    
    // Get all booking keys with creation dates
    const allKeys = await BookingKey.find({}).sort({ createdAt: 1 });
    
    console.log(`\nFound ${allKeys.length} booking keys in database:`);
    allKeys.forEach((key, index) => {
      const createdDate = key.createdAt ? key.createdAt.toISOString().split('T')[0] : 'Unknown';
      console.log(`${index + 1}. "${key.name}" - Created: ${createdDate}`);
    });
    
    // Check for any keys created before September 7, 2025
    const originalKeys = allKeys.filter(key => 
      key.createdAt && key.createdAt < new Date('2025-09-07')
    );
    
    if (originalKeys.length > 0) {
      console.log('\n🎉 Found original booking keys (created before Sept 7, 2025):');
      originalKeys.forEach(key => {
        console.log(`  - "${key.name}" (${key.createdAt.toISOString().split('T')[0]})`);
      });
    } else {
      console.log('\n❌ No original booking keys found (all created on/after Sept 7, 2025)');
    }
    
    // Check MongoDB Atlas backup options
    console.log('\n🔄 MongoDB Atlas Backup Information:');
    console.log('MongoDB Atlas provides automatic backups with point-in-time recovery.');
    console.log('To access backups:');
    console.log('1. Log into MongoDB Atlas (https://cloud.mongodb.com)');
    console.log('2. Go to your cluster');
    console.log('3. Click "Backup" tab');
    console.log('4. Look for snapshots from before September 7, 2025');
    console.log('\nIf backups exist, you can restore to a point before your keys were changed.');
    
    // Check for audit trail or change logs
    console.log('\n📝 Checking for audit trail data...');
    
    try {
      const AuditTrail = mongoose.model('AuditTrail', new mongoose.Schema({
        action: String,
        collection: String,
        documentId: String,
        changes: Object,
        user: Object,
        timestamp: Date
      }));
      
      const auditLogs = await AuditTrail.find({
        $or: [
          { collection: 'bookingkeys' },
          { action: { $regex: /booking.*key/i } }
        ]
      }).sort({ timestamp: -1 }).limit(20);
      
      if (auditLogs.length > 0) {
        console.log(`\n📋 Found ${auditLogs.length} audit trail entries related to booking keys:`);
        auditLogs.forEach(log => {
          const date = log.timestamp ? log.timestamp.toISOString().split('T')[0] : 'Unknown';
          console.log(`  - ${log.action} (${date})`);
        });
      } else {
        console.log('\n❌ No audit trail data found for booking keys');
      }
    } catch (error) {
      console.log('\n⚠️ No audit trail collection found');
    }
    
  } catch (error) {
    console.error('❌ Error checking MongoDB backups:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the check
checkMongoBackups();