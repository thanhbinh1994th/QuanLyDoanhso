// Migration helper: create database (if needed) and table schema
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'quanly';

async function migrate() {
  // connect without database to create it if missing
  const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await conn.query(`USE \`${DB_NAME}\``);
    const create = `
      CREATE TABLE IF NOT EXISTS sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_code VARCHAR(255),
        customer_name VARCHAR(255),
        date DATE,
        sacks DOUBLE,
        weight DOUBLE,
        total_weight DOUBLE,
        pieces INT,
        unit_price DOUBLE,
        amount DOUBLE,
        total_amount DOUBLE,
        note TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await conn.query(create);
    // try to create unique index on (customer_name, date) to enforce uniqueness
    try {
      await conn.query('CREATE UNIQUE INDEX idx_unique_customer_date ON sales (customer_name, date)');
    } catch (e) {
      // ignore errors (index may already exist)
    }
    console.log('Migration finished: database and table ensured.');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  migrate().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { migrate };
