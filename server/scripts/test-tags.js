import 'dotenv/config'
import { createHash } from 'node:crypto'
import { q, one } from '../src/db.js'
import { genCode } from '../src/code.js'

const BASE = 'http://127.0.0.1:3000'
const email = 'tag-test@example.com'
const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')

async function call(method, path, body, cookie = '') {
  const init = { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) } }
  if (body !== undefined) init.body = JSON.stringify(body)
  const res = await fetch(BASE + path, init)
  const data = await res.json()
  const sc = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, data, cookie: sc || cookie }
}

await q('DELETE FROM users WHERE email=?', [email])
await q('DELETE FROM email_codes WHERE email=?', [email])
const code = genCode()
await q('INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [email, 'register', h(code, email, 'register')])
const reg = await call('POST', '/api/auth/register', { username: '标签测试', email, password: 'Test12345', password2: 'Test12345', code })
const cookie = reg.cookie
console.log('1. 注册      ', reg.status)

const p = await call('POST', '/api/posts', { categoryId: 1, title: '标签测试帖', content: '正文', tags: ['求助', '分享'] }, cookie)
console.log('2. 发带标签帖', p.status, p.data.msg, 'id=', p.data.data?.id)

const cat = await call('GET', '/api/categories/general')
console.log('3. 板块标签  ', JSON.stringify(cat.data.data.tags))

const flt = await call('GET', '/api/posts?category=general&tag=' + encodeURIComponent('求助'))
console.log('4. 按标签筛  ', flt.data.data.posts.length, '条 |', flt.data.data.posts[0]?.tags)

const postId = p.data.data?.id
if (postId) {
  await q('DELETE FROM post_tags WHERE post_id=?', [postId])
  await q('DELETE FROM posts WHERE id=?', [postId])
}
await q('DELETE FROM tags WHERE category_id=1 AND name IN (?,?)', ['求助', '分享'])
const u = await one('SELECT id FROM users WHERE email=?', [email])
if (u) await q('DELETE FROM users WHERE id=?', [u.id])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('5. 已清理')
process.exit(0)
