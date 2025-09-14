const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.log('Connected to MongoDB');
    const users = await User.find().select('name email role');
    logger.log('Available users:');
    users.forEach(u => logger.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
    mongoose.disconnect();
  })
  .catch(err => {
    logger.error('Error:', err);
    mongoose.disconnect();
  });