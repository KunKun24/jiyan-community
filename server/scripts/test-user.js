import 'dotenv/config'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { q, one } from '../src/db.js'
import { genCode } from '../src/code.js'

const BASE = 'http://127.0.0.1:3000'
const email = process.env.TEST_EMAIL || 'user-test@example.com'
const username = '资料测试'
const password = 'Test12345'
const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')

async function call(method, path, body, cookie = '', raw = false) {
  const init = { method, headers: cookie ? { Cookie: cookie } : {} }
  if (!raw) {
    init.headers['Content-Type'] = 'application/json'
    if (body !== undefined) init.body = JSON.stringify(body)
  } else {
    init.body = body
  }
  const res = await fetch(BASE + path, init)
  const data = await res.json()
  const setCookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, data, cookie: setCookie || cookie }
}

await q('DELETE FROM users WHERE username=? OR email=?', [username, email])
await q('DELETE FROM email_codes WHERE email=?', [email])

const code = genCode()
await q(
  'INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
  [email, 'register', h(code, email, 'register')],
)
const reg = await call('POST', '/api/auth/register', { username, email, password, password2: password, code })
if (!reg.data.ok) {
  console.error('注册失败', reg.data)
  process.exit(1)
}
const cookie = reg.cookie
console.log('1. 注册            ', reg.status)

const p1 = await call('GET', '/api/user/profile', undefined, cookie)
console.log('2. 读取资料        ', p1.status, p1.data.data.user.username, JSON.stringify(p1.data.data.stats))
const uid = p1.data.data.user.id

const up = await call(
  'PATCH',
  '/api/user/profile',
  { username: '资料测试改名', bio: '喜欢安静的地方。', location: '杭州', website: 'https://example.com', contact: 'TG @test' },
  cookie,
)
console.log('3. 修改资料        ', up.status, up.data.msg, '| bio:', up.data.data?.user?.bio)

const wrong = await call('POST', '/api/user/password', { oldPassword: 'nope', newPassword: 'NewPass123', confirmPassword: 'NewPass123' }, cookie)
console.log('4. 原密码错误      ', wrong.status, wrong.data.msg)

const pw = await call('POST', '/api/user/password', { oldPassword: password, newPassword: 'NewPass123', confirmPassword: 'NewPass123' }, cookie)
console.log('5. 修改密码        ', pw.status, pw.data.msg)

const login2 = await call('POST', '/api/auth/login', { account: '资料测试改名', password: 'NewPass123' })
console.log('6. 新密码登录      ', login2.status, login2.data.ok)

const png = fs.readFileSync('/www/wwwroot/极验社区/web/public/logo.png')
const fd = new FormData()
fd.append('file', new Blob([png], { type: 'image/png' }), 'logo.png')
const av = await call('POST', '/api/user/avatar', fd, cookie, true)
console.log('7. 上传头像        ', av.status, JSON.stringify(av.data))

const avatarUrl = av.data.data?.avatar
if (avatarUrl) {
  const img = await fetch('http://127.0.0.1' + avatarUrl, { headers: { Host: 'shequ.xn--0try77c6um82w.cn' } })
  console.log('8. 头像可访问      ', img.status, img.headers.get('content-type'))
}

// 清理
if (avatarUrl?.startsWith('/uploads/avatars/')) {
  try {
    fs.unlinkSync(`/www/wwwroot/极验社区/web${avatarUrl}`)
  } catch {}
}
await q('DELETE FROM users WHERE id=?', [uid])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('9. 测试数据已清理')
process.exit(0)
