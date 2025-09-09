const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3002';
const API_ENDPOINTS = {
    staff: '/api/users/staff',
    clients: '/api/clients',
    services: '/api/services',
    bookingKeys: '/api/booking-categories/keys',
    bookingAlerts: '/api/booking-alerts'
};

async function testDatabaseConnection() {
    console.log('\n=== Testing Database Connection ===');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connection successful');
        console.log('Database URI:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
}

async function testAPIEndpoint(name, endpoint) {
    console.log(`\n=== Testing ${name} API ===`);
    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`✅ ${name} API responded with status:`, response.status);
        
        if (response.data) {
            const data = Array.isArray(response.data) ? response.data : [response.data];
            console.log(`📊 ${name} count:`, data.length);
            
            if (data.length > 0) {
                console.log(`📋 Sample ${name} data:`);
                const sample = data[0];
                
                // Special handling for different data types
                if (name === 'Staff') {
                    console.log('  - ID:', sample._id);
                    console.log('  - Name:', sample.name || 'N/A');
                    console.log('  - First Name:', sample.firstName || 'N/A');
                    console.log('  - Last Name:', sample.lastName || 'N/A');
                    console.log('  - Email:', sample.email || 'N/A');
                    console.log('  - Role:', sample.role || 'N/A');
                } else if (name === 'Clients') {
                    console.log('  - ID:', sample._id);
                    console.log('  - Name:', sample.name || 'N/A');
                    console.log('  - Email:', sample.email || 'N/A');
                    console.log('  - Phone:', sample.phone || 'N/A');
                } else if (name === 'Services') {
                    console.log('  - ID:', sample._id);
                    console.log('  - Name:', sample.name || 'N/A');
                    console.log('  - Booking Key:', sample.bookingKey || 'N/A');
                    console.log('  - Duration:', sample.duration || 'N/A');
                } else {
                    console.log('  - Sample keys:', Object.keys(sample).slice(0, 5).join(', '));
                }
            }
        }
        return true;
    } catch (error) {
        console.log(`❌ ${name} API failed:`, error.response?.status || error.message);
        if (error.response?.data) {
            console.log('   Error details:', error.response.data);
        }
        return false;
    }
}

async function testStaffNameFields() {
    console.log('\n=== Testing Staff Name Fields ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/users/staff`);
        const staff = response.data;
        
        let withFirstLastName = 0;
        let withNameOnly = 0;
        let missingNames = 0;
        
        staff.forEach(member => {
            if (member.firstName && member.lastName) {
                withFirstLastName++;
            } else if (member.name) {
                withNameOnly++;
            } else {
                missingNames++;
            }
        });
        
        console.log(`📊 Staff name field analysis:`);
        console.log(`  - With firstName/lastName: ${withFirstLastName}`);
        console.log(`  - With name only: ${withNameOnly}`);
        console.log(`  - Missing names: ${missingNames}`);
        
        return missingNames === 0;
    } catch (error) {
        console.log('❌ Staff name field test failed:', error.message);
        return false;
    }
}

async function testBookingFormData() {
    console.log('\n=== Testing Booking Form Data ===');
    const results = {};
    
    // Test all endpoints that the booking form uses
    results.staff = await testAPIEndpoint('Staff', API_ENDPOINTS.staff);
    results.clients = await testAPIEndpoint('Clients', API_ENDPOINTS.clients);
    results.services = await testAPIEndpoint('Services', API_ENDPOINTS.services);
    results.bookingKeys = await testAPIEndpoint('Booking Keys', API_ENDPOINTS.bookingKeys);
    
    const allWorking = Object.values(results).every(result => result === true);
    console.log(`\n📋 Booking form data status: ${allWorking ? '✅ All working' : '❌ Some issues found'}`);
    
    return allWorking;
}

async function testBookingAlerts() {
    console.log('\n=== Testing Booking Alerts ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/booking-alerts`);
        console.log('✅ Booking alerts API accessible');
        console.log('📊 Alerts count:', response.data?.length || 0);
        return true;
    } catch (error) {
        console.log('❌ Booking alerts test failed:', error.response?.status || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🔍 RESTORATION VERIFICATION TEST');
    console.log('================================');
    
    const results = {
        database: await testDatabaseConnection(),
        staffNames: await testStaffNameFields(),
        bookingForm: await testBookingFormData(),
        bookingAlerts: await testBookingAlerts()
    };
    
    console.log('\n📊 FINAL RESULTS');
    console.log('================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Restoration appears to be successful!');
        console.log('   - Database connection is working');
        console.log('   - Staff name fields are properly populated');
        console.log('   - All booking form APIs are responding');
        console.log('   - Booking alerts system is accessible');
    } else {
        console.log('\n⚠️  Some issues remain after restoration:');
        Object.entries(results).forEach(([test, passed]) => {
            if (!passed) {
                console.log(`   - ${test} needs attention`);
            }
        });
    }
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});