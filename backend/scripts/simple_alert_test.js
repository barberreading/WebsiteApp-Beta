const axios = require('axios');

async function testStaffAlerts() {
    try {
        console.log('Testing staff booking alerts...');
        
        // Login as staff
        const login = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'barberreading@hotmail.co.uk',
            password: 'password123'
        });
        
        console.log('✓ Staff login successful:', login.data.user.name);
        console.log('  User ID:', login.data.user._id);
        console.log('  Role:', login.data.user.role);
        
        // Get booking alerts
        const alerts = await axios.get('http://localhost:3002/api/booking-alerts/available', {
            headers: { Authorization: `Bearer ${login.data.token}` }
        });
        
        console.log('\n✓ Booking alerts retrieved:', alerts.data.alerts?.length || 0);
        
        if (alerts.data.alerts && alerts.data.alerts.length > 0) {
            console.log('\nAlert details:');
            alerts.data.alerts.forEach((alert, i) => {
                console.log(`  ${i+1}. ${alert.service} - ${alert.date} ${alert.startTime}`);
                console.log(`     Client: ${alert.clientName}`);
                console.log(`     Status: ${alert.status}`);
            });
            
            console.log('\n✅ SUCCESS: Booking alerts are available for staff user!');
            console.log('   With our Calendar.js fix, these should now display in the staff calendar.');
        } else {
            console.log('\n⚠️  No booking alerts found for this staff user.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('   Response:', error.response.data);
        }
    }
}

testStaffAlerts();