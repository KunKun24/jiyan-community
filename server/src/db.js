import 'dotenv/config'
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
})

/** 查询：返回行数组 */
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

/** 查询单行 */
export async function one(sql, params = []) {
  const rows = await q(sql, params)
  return rows[0] || null
}
