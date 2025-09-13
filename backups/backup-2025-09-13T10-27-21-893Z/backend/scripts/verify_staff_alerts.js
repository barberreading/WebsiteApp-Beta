const axios = require('axios');

const loginAndGetToken = async () => {
  try {
    // Login as staff user
    const loginRes = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'barberreading@hotmail.co.uk',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('---TOKEN---');
    console.log(token);
    console.log('---END-TOKEN---');

  } catch (err) {
    console.error('Error during login:', err.response ? err.response.data : err.message);
  }
};

loginAndGetToken();