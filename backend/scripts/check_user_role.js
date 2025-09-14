const axios = require('axios');

// Check current user role structure
async function checkUserRole() {
  try {
    // Login as staff user
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'barberreading@hotmail.co.uk',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    logger.log('Login successful');
    
    // Get user profile
    const profileResponse = await axios.get('http://localhost:3002/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentUser = profileResponse.data;
    logger.log('\n=== CURRENT USER OBJECT ===');
    logger.log('Name:', currentUser.name || currentUser.firstName + ' ' + currentUser.lastName);
    logger.log('Email:', currentUser.email);
    logger.log('Role:', currentUser.role);
    logger.log('ID:', currentUser._id);
    logger.log('Role type:', typeof currentUser.role);
    logger.log('Is staff?:', currentUser.role === 'staff');
    
  } catch (error) {
    logger.error('Error:', error.message);
  }
}

checkUserRole();