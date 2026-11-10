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

// 会话时区固定为北京时间，避免 NOW() 按 UTC 落库导致前端差 8 小时
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+08:00'")
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
