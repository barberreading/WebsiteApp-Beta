const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://barberreading:CP41wgaa3ADAw3oV@eca0.jvyy1in.mongodb.net/test?retryWrites=true&w=majority&appName=ECA0')
  .then(async () => {
    console.log('Connected to MongoDB');
    const users = await User.find().select('name email role');
    console.log('Available users:');
    users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });