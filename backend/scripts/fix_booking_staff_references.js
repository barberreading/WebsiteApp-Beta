const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
require('dotenv').config();

async function fixBookingStaffReferences() {
  try {
    logger.log('Fixing booking staff references...');
    
    // Connect to database
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.log('Connected successfully!');
    
    // Get all staff users
    const staffUsers = await User.find({ role: 'staff' }).select('_id firstName lastName email');
    logger.log(`\nFound ${staffUsers.length} staff users:`);
    staffUsers.forEach(user => {
      logger.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
    });
    
    // Get all bookings with broken references
    const brokenBookings = await Booking.find({ staff: '68b757ea81487c1c4c96be00' });
    logger.log(`\nFound ${brokenBookings.length} bookings with broken staff reference`);
    
    if (brokenBookings.length === 0) {
      logger.log('No bookings need fixing!');
      return;
    }
    
    // Since we don't know which staff member these bookings should belong to,
    // let's distribute them among the available staff members
    // or assign them to the first staff member as a default
    
    if (staffUsers.length === 0) {
      logger.log('ERROR: No staff users found to assign bookings to!');
      return;
    }
    
    // Option 1: Assign all to the first staff member
    const defaultStaff = staffUsers[0];
    logger.log(`\nAssigning all ${brokenBookings.length} bookings to: ${defaultStaff.firstName} ${defaultStaff.lastName}`);
    
    // Update all broken bookings
    const updateResult = await Booking.updateMany(
      { staff: '68b757ea81487c1c4c96be00' },
      { staff: defaultStaff._id }
    );
    
    logger.log(`\nUpdate completed:`);
    logger.log(`- Modified ${updateResult.modifiedCount} bookings`);
    logger.log(`- Matched ${updateResult.matchedCount} bookings`);
    
    // Verify the fix
    logger.log('\n=== VERIFICATION ===');
    const verifyBookings = await Booking.find({ staff: defaultStaff._id }).populate('staff', 'firstName lastName').limit(5);
    logger.log(`Found ${verifyBookings.length} bookings now assigned to ${defaultStaff.firstName} ${defaultStaff.lastName}:`);
    verifyBookings.forEach(booking => {
      const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'Unknown Staff';
      logger.log(`- ${booking.startTime} - Staff: ${staffName}`);
    });
    
    // Check for any remaining broken references
    const remainingBroken = await Booking.find({ staff: '68b757ea81487c1c4c96be00' });
    if (remainingBroken.length > 0) {
      logger.log(`\nWARNING: ${remainingBroken.length} bookings still have broken references!`);
    } else {
      logger.log('\n✅ All booking references have been fixed!');
    }
    
  } catch (error) {
    logger.error('Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    logger.log('\nDatabase connection closed');
  }
}

fixBookingStaffReferences();