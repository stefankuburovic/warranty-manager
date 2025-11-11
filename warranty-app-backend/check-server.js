#!/usr/bin/env node

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: 'running', data: JSON.parse(data) });
        } else {
          reject({ status: 'error', statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject({ status: 'not_running', error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ status: 'timeout', error: 'Server did not respond' });
    });
  });
};

checkServer()
  .then((result) => {
    console.log('✅ Backend server is running!');
    console.log('   Status:', result.status);
    console.log('   Response:', JSON.stringify(result.data, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Backend server is NOT running');
    console.log('   Error:', error.error || error.status);
    console.log('\n📋 To start the server:');
    console.log('   cd warranty-app-backend');
    console.log('   npm start');
    console.log('   # or for development:');
    console.log('   npm run dev');
    process.exit(1);
  });

