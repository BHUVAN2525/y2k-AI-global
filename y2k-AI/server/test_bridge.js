const axios = require('axios');

async function testHealth() {
    try {
        console.log('Testing connection to http://localhost:8001/health...');
        const res = await axios.get('http://localhost:8001/health', { timeout: 5000 });
        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.request) {
            console.error('No response received');
        }
    }
}

testHealth();
