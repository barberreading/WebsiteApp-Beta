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
    logger.log('\n=== Testing Database Connection ===');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.log('✅ Database connection successful');
        logger.log('Database URI:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
        return true;
    } catch (error) {
        logger.log('❌ Database connection failed:', error.message);
        return false;
    }
}

async function testAPIEndpoint(name, endpoint) {
    logger.log(`\n=== Testing ${name} API ===`);
    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        logger.log(`✅ ${name} API responded with status:`, response.status);
        
        if (response.data) {
            const data = Array.isArray(response.data) ? response.data : [response.data];
            logger.log(`📊 ${name} count:`, data.length);
            
            if (data.length > 0) {
                logger.log(`📋 Sample ${name} data:`);
                const sample = data[0];
                
                // Special handling for different data types
                if (name === 'Staff') {
                    logger.log('  - ID:', sample._id);
                    logger.log('  - Name:', sample.name || 'N/A');
                    logger.log('  - First Name:', sample.firstName || 'N/A');
                    logger.log('  - Last Name:', sample.lastName || 'N/A');
                    logger.log('  - Email:', sample.email || 'N/A');
                    logger.log('  - Role:', sample.role || 'N/A');
                } else if (name === 'Clients') {
                    logger.log('  - ID:', sample._id);
                    logger.log('  - Name:', sample.name || 'N/A');
                    logger.log('  - Email:', sample.email || 'N/A');
                    logger.log('  - Phone:', sample.phone || 'N/A');
                } else if (name === 'Services') {
                    logger.log('  - ID:', sample._id);
                    logger.log('  - Name:', sample.name || 'N/A');
                    logger.log('  - Booking Key:', sample.bookingKey || 'N/A');
                    logger.log('  - Duration:', sample.duration || 'N/A');
                } else {
                    logger.log('  - Sample keys:', Object.keys(sample).slice(0, 5).join(', '));
                }
            }
        }
        return true;
    } catch (error) {
        logger.log(`❌ ${name} API failed:`, error.response?.status || error.message);
        if (error.response?.data) {
            logger.log('   Error details:', error.response.data);
        }
        return false;
    }
}

async function testStaffNameFields() {
    logger.log('\n=== Testing Staff Name Fields ===');
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
        
        logger.log(`📊 Staff name field analysis:`);
        logger.log(`  - With firstName/lastName: ${withFirstLastName}`);
        logger.log(`  - With name only: ${withNameOnly}`);
        logger.log(`  - Missing names: ${missingNames}`);
        
        return missingNames === 0;
    } catch (error) {
        logger.log('❌ Staff name field test failed:', error.message);
        return false;
    }
}

async function testBookingFormData() {
    logger.log('\n=== Testing Booking Form Data ===');
    const results = {};
    
    // Test all endpoints that the booking form uses
    results.staff = await testAPIEndpoint('Staff', API_ENDPOINTS.staff);
    results.clients = await testAPIEndpoint('Clients', API_ENDPOINTS.clients);
    results.services = await testAPIEndpoint('Services', API_ENDPOINTS.services);
    results.bookingKeys = await testAPIEndpoint('Booking Keys', API_ENDPOINTS.bookingKeys);
    
    const allWorking = Object.values(results).every(result => result === true);
    logger.log(`\n📋 Booking form data status: ${allWorking ? '✅ All working' : '❌ Some issues found'}`);
    
    return allWorking;
}

async function testBookingAlerts() {
    logger.log('\n=== Testing Booking Alerts ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/booking-alerts`);
        logger.log('✅ Booking alerts API accessible');
        logger.log('📊 Alerts count:', response.data?.length || 0);
        return true;
    } catch (error) {
        logger.log('❌ Booking alerts test failed:', error.response?.status || error.message);
        return false;
    }
}

async function runAllTests() {
    logger.log('🔍 RESTORATION VERIFICATION TEST');
    logger.log('================================');
    
    const results = {
        database: await testDatabaseConnection(),
        staffNames: await testStaffNameFields(),
        bookingForm: await testBookingFormData(),
        bookingAlerts: await testBookingAlerts()
    };
    
    logger.log('\n📊 FINAL RESULTS');
    logger.log('================');
    Object.entries(results).forEach(([test, passed]) => {
        logger.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    logger.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        logger.log('\n🎉 Restoration appears to be successful!');
        logger.log('   - Database connection is working');
        logger.log('   - Staff name fields are properly populated');
        logger.log('   - All booking form APIs are responding');
        logger.log('   - Booking alerts system is accessible');
    } else {
        logger.log('\n⚠️  Some issues remain after restoration:');
        Object.entries(results).forEach(([test, passed]) => {
            if (!passed) {
                logger.log(`   - ${test} needs attention`);
            }
        });
    }
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.log('\n🔌 Database connection closed');
    }
}

// Run the tests
runAllTests().catch(error => {
    logger.error('❌ Test execution failed:', error);
    process.exit(1);
});