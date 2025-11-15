/*
  MySQL-backed DB module using mysql2/promise
  Configure via env vars:
    DB_HOST (default: localhost)
    DB_USER (default: root)
    DB_PASSWORD (default: '')
    DB_NAME (default: quanly)
*/
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'quanly';

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function add(record) {
  const conn = await pool.getConnection();
  try {
    // Direct insert without duplicate checking (user requested to disable duplicate detection)
    const cname = (record.customer_name || '').trim();
    const sql = `INSERT INTO sales (customer_code, customer_name, date, sacks, weight, total_weight, pieces, unit_price, amount, total_amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [record.customer_code || '', cname, record.date || null, record.sacks || 0, record.weight || 0, record.total_weight || 0, record.pieces || 0, record.unit_price || 0, record.amount || 0, record.total_amount || 0, record.note || ''];
    const [res] = await conn.execute(sql, params);
    return res.insertId;
  } finally {
    conn.release();
  }
}

async function addMany(records) {
  // simple insert one by one inside transaction
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let inserted = 0;
    // Insert all records without duplicate checks
    for (const record of records) {
      const cname = (record.customer_name || '').trim();
      const sql = `INSERT INTO sales (customer_code, customer_name, date, sacks, weight, total_weight, pieces, unit_price, amount, total_amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [record.customer_code || '', cname, record.date || null, record.sacks || 0, record.weight || 0, record.total_weight || 0, record.pieces || 0, record.unit_price || 0, record.amount || 0, record.total_amount || 0, record.note || ''];
      await conn.execute(sql, params);
      inserted++;
    }
    await conn.commit();
    return { inserted, skipped: 0 };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function query({ customer, from, to } = {}) {
  let sql = 'SELECT * FROM sales WHERE 1=1';
  const params = [];
  if (customer) { sql += ' AND customer_name = ?'; params.push(customer); }
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function monthly(year) {
  let sql = `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(total_amount) as revenue FROM sales WHERE 1=1`;
  const params = [];
  if (year) { sql += ' AND DATE_FORMAT(date, "%Y") = ?'; params.push(year); }
  sql += ' GROUP BY month ORDER BY month';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function update(id, record) {
  const sql = `UPDATE sales SET customer_code = ?, customer_name = ?, date = ?, sacks = ?, weight = ?, total_weight = ?, pieces = ?, unit_price = ?, amount = ?, total_amount = ?, note = ? WHERE id = ?`;
  const params = [record.customer_code || '', (record.customer_name || '').trim(), record.date || null, record.sacks || 0, record.weight || 0, record.total_weight || 0, record.pieces || 0, record.unit_price || 0, record.amount || 0, record.total_amount || 0, record.note || '', id];
  const [res] = await pool.execute(sql, params);
  return res.affectedRows;
}

async function remove(id) {
  const sql = `DELETE FROM sales WHERE id = ?`;
  const [res] = await pool.execute(sql, [id]);
  return res.affectedRows;
}

module.exports = { add, addMany, query, monthly, pool, update, remove };
// add update and remove exports

