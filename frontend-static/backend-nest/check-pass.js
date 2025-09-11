require('dotenv').config();
console.log('DB_PASSWORD из .env:', process.env.DB_PASSWORD);
console.log('Длина:', process.env.DB_PASSWORD.length);
