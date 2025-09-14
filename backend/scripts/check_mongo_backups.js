require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongoBackups() {
  try {
    logger.log('=== Checking MongoDB Atlas for Backup Data ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('✓ Connected to MongoDB Atlas\n');
    
    // Get database instance
    const db = mongoose.connection.db;
    
    // List all collections
    logger.log('📋 Available Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      logger.log(`  - ${collection.name}`);
    });
    
    logger.log('\n🔍 Checking for backup or historical collections...');
    
    // Look for backup collections
    const backupCollections = collections.filter(col => 
      col.name.includes('backup') || 
      col.name.includes('old') || 
      col.name.includes('archive') ||
      col.name.includes('history')
    );
    
    if (backupCollections.length > 0) {
      logger.log('\n📦 Found potential backup collections:');
      backupCollections.forEach(col => {
        logger.log(`  - ${col.name}`);
      });
    } else {
      logger.log('\n❌ No backup collections found');
    }
    
    // Check if there's a bookingkeys collection with historical data
    logger.log('\n🔑 Checking BookingKey collection for historical data...');
    
    const BookingKey = mongoose.model('BookingKey', new mongoose.Schema({
      name: String,
      description: String,
      createdAt: Date,
      updatedAt: Date
    }, { timestamps: true }));
    
    // Get all booking keys with creation dates
    const allKeys = await BookingKey.find({}).sort({ createdAt: 1 });
    
    logger.log(`\nFound ${allKeys.length} booking keys in database:`);
    allKeys.forEach((key, index) => {
      const createdDate = key.createdAt ? key.createdAt.toISOString().split('T')[0] : 'Unknown';
      logger.log(`${index + 1}. "${key.name}" - Created: ${createdDate}`);
    });
    
    // Check for any keys created before September 7, 2025
    const originalKeys = allKeys.filter(key => 
      key.createdAt && key.createdAt < new Date('2025-09-07')
    );
    
    if (originalKeys.length > 0) {
      logger.log('\n🎉 Found original booking keys (created before Sept 7, 2025):');
      originalKeys.forEach(key => {
        logger.log(`  - "${key.name}" (${key.createdAt.toISOString().split('T')[0]})`);
      });
    } else {
      logger.log('\n❌ No original booking keys found (all created on/after Sept 7, 2025)');
    }
    
    // Check MongoDB Atlas backup options
    logger.log('\n🔄 MongoDB Atlas Backup Information:');
    logger.log('MongoDB Atlas provides automatic backups with point-in-time recovery.');
    logger.log('To access backups:');
    logger.log('1. Log into MongoDB Atlas (https://cloud.mongodb.com)');
    logger.log('2. Go to your cluster');
    logger.log('3. Click "Backup" tab');
    logger.log('4. Look for snapshots from before September 7, 2025');
    logger.log('\nIf backups exist, you can restore to a point before your keys were changed.');
    
    // Check for audit trail or change logs
    logger.log('\n📝 Checking for audit trail data...');
    
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
        logger.log(`\n📋 Found ${auditLogs.length} audit trail entries related to booking keys:`);
        auditLogs.forEach(log => {
          const date = log.timestamp ? log.timestamp.toISOString().split('T')[0] : 'Unknown';
          logger.log(`  - ${log.action} (${date})`);
        });
      } else {
        logger.log('\n❌ No audit trail data found for booking keys');
      }
    } catch (error) {
      logger.log('\n⚠️ No audit trail collection found');
    }
    
  } catch (error) {
    logger.error('❌ Error checking MongoDB backups:', error.message);
  } finally {
    await mongoose.disconnect();
    logger.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the check
checkMongoBackups();