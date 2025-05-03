const crypto = require('crypto');

// Generate a 32-byte (256-bit) key
const key = crypto.randomBytes(32);
// Generate a 16-byte (128-bit) IV
const iv = crypto.randomBytes(16);

console.log('Add these to your environment variables:');
console.log(`CREDS_KEY=${key.toString('hex')}`);
console.log(`CREDS_IV=${iv.toString('hex')}`); 