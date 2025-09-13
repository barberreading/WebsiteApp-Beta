const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const BookingAlert = require('./models/BookingAlert');
const LeaveRequest = require('./models/LeaveRequest');
const Client = require('./models/Client');
const { Service } = require('./models/Service');
require('dotenv').config();

async function createTestCalendarData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the staff user
        const staffEmail = 'barberreading@hotmail.co.uk';
        const staffUser = await User.findOne({ email: staffEmail });
        if (!staffUser) {
            console.log('❌ Staff user not found!');
            return;
        }
        
        console.log(`✅ Found staff user: ${staffUser._id}`);
        
        // Get or create a test client
        let testClient = await Client.findOne({ name: 'Test Client' });
        if (!testClient) {
            testClient = new Client({
                name: 'Test Client',
                email: 'testclient@example.com',
                phone: '123-456-7890',
                address: '123 Test Street',
                emergencyContact: {
                    name: 'Emergency Contact',
                    phone: '987-654-3210'
                }
            });
            await testClient.save();
            console.log('✅ Created test client');
        }
        
        // Create a test service with required createdBy field
        const testService = new Service({
            name: 'Test Service - ' + Date.now(),
            description: 'Test service for calendar testing',
            duration: 60,
            price: 50,
            createdBy: staffUser._id
        });
        await testService.save();
        console.log('✅ Created test service');
        
        // Create test booking for today
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Create proper Date objects for start and end times
        const startTime = new Date(today);
        startTime.setHours(10, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(11, 0, 0, 0);
        
        const testBooking = new Booking({
            title: 'Test Booking - Calendar Display',
            description: 'Test booking for calendar display',
            startTime: startTime,
            endTime: endTime,
            service: testService._id,
            staff: staffUser._id,
            client: testClient._id,
            status: 'scheduled'
        });
        await testBooking.save();
        console.log('✅ Created test booking for today');
        
        // Create test booking alert with all required fields
        const alertStartTime = new Date(tomorrow);
        alertStartTime.setHours(14, 0, 0, 0);
        const alertEndTime = new Date(tomorrow);
        alertEndTime.setHours(15, 0, 0, 0);
        
        const testAlert = new BookingAlert({
            title: 'Test Calendar Alert',
            description: 'This is a test alert for calendar display',
            startTime: alertStartTime,
            endTime: alertEndTime,
            service: testService._id,
            client: testClient._id,
            manager: staffUser._id,
            location: {
                address: '123 Test Street, Test City'
            },
            status: 'open'
        });
        await testAlert.save();
        console.log('✅ Created test booking alert for tomorrow');
        
        // Create test leave request (must be at least one week in advance)
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        const twoWeeksEnd = new Date(twoWeeksFromNow);
        twoWeeksEnd.setDate(twoWeeksEnd.getDate() + 2);
        
        const testLeaveRequest = new LeaveRequest({
            staff: staffUser._id,
            staffId: staffUser._id,
            staffName: 'Test Booker',
            leaveType: 'vacation',
            startDate: twoWeeksFromNow.toISOString().split('T')[0],
            endDate: twoWeeksEnd.toISOString().split('T')[0],
            reason: 'Test vacation leave for calendar display',
            status: 'approved',
            appliedDate: today
        });
        await testLeaveRequest.save();
        console.log('✅ Created test leave request for next week');
        
        // Verify the created data
        console.log('\n--- VERIFICATION ---');
        const bookings = await Booking.find({ staffId: staffUser._id });
        const alerts = await BookingAlert.find({ staffId: staffUser._id });
        const leaveRequests = await LeaveRequest.find({ staffId: staffUser._id });
        
        console.log(`📅 Total Bookings: ${bookings.length}`);
        console.log(`🚨 Total Alerts: ${alerts.length}`);
        console.log(`🏖️ Total Leave Requests: ${leaveRequests.length}`);
        console.log(`🎯 Total Calendar Events: ${bookings.length + alerts.length + leaveRequests.length}`);
        
        console.log('\n✅ Test calendar data created successfully!');
        console.log('   Now the staff calendar should display these events.');
        console.log('   Please refresh the calendar page to see the new data.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        console.log('\nDisconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestCalendarData();