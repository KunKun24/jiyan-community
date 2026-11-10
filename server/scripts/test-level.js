import 'dotenv/config'
import { createHash } from 'node:crypto'
import { q, one } from '../src/db.js'
import { genCode } from '../src/code.js'

const BASE = 'http://127.0.0.1:3000'
const A = { email: 'lvl-a@example.com', name: '等级甲' }
const B = { email: 'lvl-b@example.com', name: '等级乙' }
const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')

async function call(method, path, body, cookie = '') {
  const init = { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) } }
  if (body !== undefined) init.body = JSON.stringify(body)
  const res = await fetch(BASE + path, init)
  const data = await res.json()
  const sc = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, data, cookie: sc || cookie }
}

async function mkUser(u) {
  await q('DELETE FROM users WHERE email=?', [u.email])
  await q('DELETE FROM email_codes WHERE email=?', [u.email])
  const code = genCode()
  await q(
    'INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
    [u.email, 'register', h(code, u.email, 'register')],
  )
  const r = await call('POST', '/api/auth/register', {
    username: u.name,
    email: u.email,
    password: 'Test12345',
    password2: 'Test12345',
    code,
  })
  return r
}

const ra = await mkUser(A)
const rb = await mkUser(B)
console.log('1. 两账号注册', ra.status, rb.status)

const p = await call('GET', '/api/user/profile', undefined, ra.cookie)
console.log('2. 初始等级  ', p.data.data.level.name, 'Lv' + p.data.data.level.level, '贡献', p.data.data.user.points)

const ck = await call('POST', '/api/user/checkin', {}, ra.cookie)
console.log('3. 签到      ', ck.status, ck.data.msg, '贡献', ck.data.data?.user?.points)

const ck2 = await call('POST', '/api/user/checkin', {}, ra.cookie)
console.log('4. 重复签到  ', ck2.status, ck2.data.msg)

const post = await call('POST', '/api/posts', { categoryId: 1, title: '等级测试帖', content: '正文', tags: [] }, ra.cookie)
const pid = post.data.data.id
console.log('5. 发帖      ', post.status, '贡献应 +10')

await call('POST', `/api/posts/${pid}/replies`, { content: '回复一下' }, rb.cookie)
console.log('6. 乙回复    ', '乙 +2')

const like = await call('POST', `/api/posts/${pid}/like`, {}, rb.cookie)
console.log('7. 乙点赞甲  ', like.status, JSON.stringify(like.data.data))

const detail = await call('GET', `/api/posts/${pid}`, undefined, rb.cookie)
console.log('8. 详情      ', 'likeCount=' + detail.data.data.post.likeCount, 'liked=' + detail.data.data.post.liked)

const share = await call('POST', `/api/posts/${pid}/share`, {}, rb.cookie)
console.log('9. 分享      ', share.status, JSON.stringify(share.data.data))

const fa = await call('GET', '/api/user/profile', undefined, ra.cookie)
console.log('10. 甲最终   ', '贡献', fa.data.data.user.points, '成长', fa.data.data.level.growth, fa.data.data.level.name)

// 清理
await q('DELETE FROM post_likes WHERE post_id=?', [pid])
await q('DELETE FROM share_logs WHERE post_id=?', [pid])
await q('DELETE FROM post_tags WHERE post_id=?', [pid])
await q('DELETE FROM replies WHERE post_id=?', [pid])
await q('DELETE FROM posts WHERE id=?', [pid])
for (const u of [A, B]) {
  const row = await one('SELECT id FROM users WHERE email=?', [u.email])
  if (row) await q('DELETE FROM users WHERE id=?', [row.id])
  await q('DELETE FROM email_codes WHERE email=?', [u.email])
}
console.log('11. 已清理')
process.exit(0)
