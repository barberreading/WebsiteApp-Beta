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
    console.log('Login successful');
    
    // Get user profile
    const profileResponse = await axios.get('http://localhost:3002/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentUser = profileResponse.data;
    console.log('\n=== CURRENT USER OBJECT ===');
    console.log('Name:', currentUser.name || currentUser.firstName + ' ' + currentUser.lastName);
    console.log('Email:', currentUser.email);
    console.log('Role:', currentUser.role);
    console.log('ID:', currentUser._id);
    console.log('Role type:', typeof currentUser.role);
    console.log('Is staff?:', currentUser.role === 'staff');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserRole();