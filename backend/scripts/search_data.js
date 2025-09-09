const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/?retryWrites=true&w=majority&appName=ECA0')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    
    console.log('\n=== ALL DATABASES ===');
    databases.databases.forEach(db => {
      console.log(`- Database: ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check each database for Andrew Barber or booking/timesheet data
    for (const database of databases.databases) {
      if (database.name === 'admin' || database.name === 'local' || database.name === 'config') {
        continue; // Skip system databases
      }
      
      console.log(`\n=== CHECKING DATABASE: ${database.name} ===`);
      
      // Switch to this database
      const db = mongoose.connection.client.db(database.name);
      const collections = await db.listCollections().toArray();
      
      console.log(`Collections in ${database.name}:`);
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
        
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
            console.log(`    *** FOUND ANDREW BARBER DATA in ${col.name}! ***`);
            andrewDocs.forEach(doc => {
              console.log('      -', JSON.stringify(doc, null, 2));
            });
          }
          
          // Also check for bookings and timesheets
          if (col.name.toLowerCase().includes('booking') || col.name.toLowerCase().includes('timesheet')) {
            const samples = await db.collection(col.name).find({}).limit(3).toArray();
            console.log(`    Sample data from ${col.name}:`);
            samples.forEach(doc => {
              console.log('      -', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            });
          }
        }
      }
    }
    
    mongoose.disconnect();
  })
  .catch(err => console.error('Connection error:', err));