// Save this as test-dotenv.js in your Backend folder
require('dotenv').config();

console.log('=== Testing dotenv ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '[SET]' : '[NOT SET]');

// Check if file exists
const fs = require('fs');
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  console.log('\n=== .env file exists ===');
  console.log(`File size: ${envFile.length} bytes`);
  console.log('First few lines:');
  console.log(envFile.split('\n').slice(0, 5).join('\n'));
} catch (error) {
  console.error('\n=== .env file error ===');
  console.error(error.message);
  
  // Check current directory
  console.log('\n=== Current directory files ===');
  const files = fs.readdirSync('.');
  console.log(files.join('\n'));
}