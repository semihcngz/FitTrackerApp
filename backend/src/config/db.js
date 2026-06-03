const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Successfully connected to postgresql');
    release();
  }
});

// Run SET timezone on every new connection so DATE() comparisons
// always reflect local time (Europe/Istanbul = UTC+3)
pool.on('connect', (client) => {
  client.query("SET timezone = 'Europe/Istanbul'");
});

module.exports = pool;
