const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('Connected to MongoDB Atlas');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    
    logger.log('\n=== ALL DATABASES ===');
    databases.databases.forEach(db => {
      logger.log(`- Database: ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check each database for Andrew Barber or booking/timesheet data
    for (const database of databases.databases) {
      if (database.name === 'admin' || database.name === 'local' || database.name === 'config') {
        continue; // Skip system databases
      }
      
      logger.log(`\n=== CHECKING DATABASE: ${database.name} ===`);
      
      // Switch to this database
      const db = mongoose.connection.client.db(database.name);
      const collections = await db.listCollections().toArray();
      
      logger.log(`Collections in ${database.name}:`);
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        logger.log(`  - ${col.name}: ${count} documents`);
        
        // Search for Andrew Barber in this collection
        if (count > 0) {
          const andrewDocs = await db.collection(col.name)
            .find({
              $or: [
                { name: /andrew/i },
                { name: /barber/i },
                { email: /andrew/i },
                { email: /barber/i },
                { staff: /andrew/i },
                { staff: /barber/i },
                { user: /andrew/i },
                { user: /barber/i }
              ]
            }).toArray();
          
          if (andrewDocs.length > 0) {
            logger.log(`    *** FOUND ANDREW BARBER DATA in ${col.name}! ***`);
            andrewDocs.forEach(doc => {
              logger.log('      -', JSON.stringify(doc, null, 2));
            });
          }
          
          // Also check for bookings and timesheets
          if (col.name.toLowerCase().includes('booking') || col.name.toLowerCase().includes('timesheet')) {
            const samples = await db.collection(col.name).find({}).limit(3).toArray();
            logger.log(`    Sample data from ${col.name}:`);
            samples.forEach(doc => {
              logger.log('      -', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            });
          }
        }
      }
    }
    
    mongoose.disconnect();
  })
  .catch(err => logger.error('Connection error:', err));