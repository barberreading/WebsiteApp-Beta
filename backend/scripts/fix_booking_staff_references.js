const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
require('dotenv').config();

async function fixBookingStaffReferences() {
  try {
    console.log('Fixing booking staff references...');
    
    // Connect to database
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected successfully!');
    
    // Get all staff users
    const staffUsers = await User.find({ role: 'staff' }).select('_id firstName lastName email');
    console.log(`\nFound ${staffUsers.length} staff users:`);
    staffUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
    });
    
    // Get all bookings with broken references
    const brokenBookings = await Booking.find({ staff: '68b757ea81487c1c4c96be00' });
    console.log(`\nFound ${brokenBookings.length} bookings with broken staff reference`);
    
    if (brokenBookings.length === 0) {
      console.log('No bookings need fixing!');
      return;
    }
    
    // Since we don't know which staff member these bookings should belong to,
    // let's distribute them among the available staff members
    // or assign them to the first staff member as a default
    
    if (staffUsers.length === 0) {
      console.log('ERROR: No staff users found to assign bookings to!');
      return;
    }
    
    // Option 1: Assign all to the first staff member
    const defaultStaff = staffUsers[0];
    console.log(`\nAssigning all ${brokenBookings.length} bookings to: ${defaultStaff.firstName} ${defaultStaff.lastName}`);
    
    // Update all broken bookings
    const updateResult = await Booking.updateMany(
      { staff: '68b757ea81487c1c4c96be00' },
      { staff: defaultStaff._id }
    );
    
    console.log(`\nUpdate completed:`);
    console.log(`- Modified ${updateResult.modifiedCount} bookings`);
    console.log(`- Matched ${updateResult.matchedCount} bookings`);
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    const verifyBookings = await Booking.find({ staff: defaultStaff._id }).populate('staff', 'firstName lastName').limit(5);
    console.log(`Found ${verifyBookings.length} bookings now assigned to ${defaultStaff.firstName} ${defaultStaff.lastName}:`);
    verifyBookings.forEach(booking => {
      const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'Unknown Staff';
      console.log(`- ${booking.startTime} - Staff: ${staffName}`);
    });
    
    // Check for any remaining broken references
    const remainingBroken = await Booking.find({ staff: '68b757ea81487c1c4c96be00' });
    if (remainingBroken.length > 0) {
      console.log(`\nWARNING: ${remainingBroken.length} bookings still have broken references!`);
    } else {
      console.log('\n✅ All booking references have been fixed!');
    }
    
  } catch (error) {
    console.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixBookingStaffReferences();