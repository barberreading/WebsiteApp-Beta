const axios = require('axios');
const fs = require('fs');

const loginAndGetToken = async () => {
  try {
    // Login as staff user
    const loginRes = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'barberreading@hotmail.co.uk',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    fs.writeFileSync('token.txt', token);
    logger.log('Token saved to token.txt');

  } catch (err) {
    logger.error('Error during login:', err.response ? err.response.data : err.message);
  }
};

loginAndGetToken();