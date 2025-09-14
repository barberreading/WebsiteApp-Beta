const mongoose = require('mongoose');
const User = require('../models/User');
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

const updateSuperuser = async () => {
  try {
    // Find existing superuser or create a new one
    const superuser = await User.findOneAndUpdate(
      { role: 'superuser' },
      {
        name: 'Andrew Barber',
        email: 'andrew@everythingchildcareagency.co.uk',
        role: 'superuser',
        // Only set password if creating a new user
        $setOnInsert: {
          password: await require('bcryptjs').hash('Admin123!', 10)
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    logger.log('Superuser updated successfully:', superuser);
    process.exit(0);
  } catch (err) {
    logger.error('Error updating superuser:', err);
    process.exit(1);
  }
};

updateSuperuser();