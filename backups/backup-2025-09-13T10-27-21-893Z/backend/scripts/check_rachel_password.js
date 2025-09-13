const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkRachelPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const rachel = await User.findOne({ email: 'rachel.green@everythingchildcareagency.co.uk' }).select('+password');
    
    if (!rachel) {
      console.log('Rachel Green not found');
      return;
    }
    
    console.log('Rachel Green details:');
    console.log('- Name:', rachel.name);
    console.log('- Email:', rachel.email);
    console.log('- Role:', rachel.role);
    console.log('- Password field exists:', 'password' in rachel);
    console.log('- Password value:', rachel.password);
    console.log('- Password type:', typeof rachel.password);
    console.log('- Password length:', rachel.password ? rachel.password.length : 'N/A');
    console.log('- Is Active:', rachel.isActive);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkRachelPassword();