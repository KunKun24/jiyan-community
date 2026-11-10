import 'dotenv/config'
import { createHash } from 'node:crypto'
import { q, one } from '../src/db.js'
import { genCode } from '../src/code.js'
import { verifyPassword } from '../src/password.js'

const BASE = 'http://127.0.0.1:3000'
const email = process.env.TEST_EMAIL || 'test@example.com'
const username = '纱雾测试'
const password = 'Test12345'

const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')

async function call(path, body = {}, cookie = '') {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  const setCookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, data, cookie: setCookie }
}

// 清理
await q('DELETE FROM users WHERE username=?', [username])
await q('DELETE FROM email_codes WHERE email=?', [email])

// 1) 真实发信链路
const sc = await call('/api/auth/send-code', { email, purpose: 'register' })
console.log('1. send-code   ', sc.status, JSON.stringify(sc.data))

// 2) 直插验证码（测试拿不到邮件里的码）
const code = genCode()
await q(
  'INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
  [email, 'register', h(code, email, 'register')],
)
console.log('   测试验证码  ', code)

// 3) 注册
const reg = await call('/api/auth/register', {
  username,
  email,
  password,
  password2: password,
  code,
})
console.log('2. register    ', reg.status, JSON.stringify(reg.data))
if (!reg.data.ok) process.exit(1)

// 4) 登录
const login = await call('/api/auth/login', { account: username, password })
console.log('3. login       ', login.status, JSON.stringify(login.data))

// 5) 找回密码
const reset = await call('/api/auth/reset-password', { username, email })
console.log('4. reset       ', reset.status, JSON.stringify(reset.data))

// 6) 验证新密码生效
const u = await one('SELECT password_hash FROM users WHERE username=?', [username])
console.log('5. 新密码 12345678 有效:', verifyPassword('12345678', u.password_hash))
console.log('   旧密码仍有效:', verifyPassword(password, u.password_hash))

const login2 = await call('/api/auth/login', { account: username, password: '12345678' })
console.log('6. 用重置后密码登录:', login2.status, JSON.stringify(login2.data.ok))

// 清理测试账号
await q('DELETE FROM users WHERE username=?', [username])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('7. 测试账号已清理')
process.exit(0)
