const axios = require('axios');

async function testStaffAlerts() {
    try {
        logger.log('Testing staff booking alerts...');
        
        // Login as staff
        const login = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'barberreading@hotmail.co.uk',
            password: 'password123'
        });
        
        logger.log('✓ Staff login successful:', login.data.user.name);
        logger.log('  User ID:', login.data.user._id);
        logger.log('  Role:', login.data.user.role);
        
        // Get booking alerts
        const alerts = await axios.get('http://localhost:3002/api/booking-alerts/available', {
            headers: { Authorization: `Bearer ${login.data.token}` }
        });
        
        logger.log('\n✓ Booking alerts retrieved:', alerts.data.alerts?.length || 0);
        
        if (alerts.data.alerts && alerts.data.alerts.length > 0) {
            logger.log('\nAlert details:');
            alerts.data.alerts.forEach((alert, i) => {
                logger.log(`  ${i+1}. ${alert.service} - ${alert.date} ${alert.startTime}`);
                logger.log(`     Client: ${alert.clientName}`);
                logger.log(`     Status: ${alert.status}`);
            });
            
            logger.log('\n✅ SUCCESS: Booking alerts are available for staff user!');
            logger.log('   With our Calendar.js fix, these should now display in the staff calendar.');
        } else {
            logger.log('\n⚠️  No booking alerts found for this staff user.');
        }
        
    } catch (error) {
        logger.error('❌ Error:', error.message);
        if (error.response?.data) {
            logger.error('   Response:', error.response.data);
        }
    }
}

testStaffAlerts();