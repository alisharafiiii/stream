import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('DEFAULT_STREAM_URL:', process.env.DEFAULT_STREAM_URL);
console.log('Is it defined?', !!process.env.DEFAULT_STREAM_URL);
