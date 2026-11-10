import 'dotenv/config'
import { createHash } from 'node:crypto'
import { q, one } from '../src/db.js'
import { genCode } from '../src/code.js'

const BASE = 'http://127.0.0.1:3000'
const email = process.env.TEST_EMAIL || 'forum-test@example.com'
const username = '发帖测试'
const password = 'Test12345'
const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')

async function call(method, path, body, cookie = '') {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json()
  const setCookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, data, cookie: setCookie || cookie }
}

// 清理并注册
await q('DELETE FROM users WHERE username=?', [username])
await q('DELETE FROM email_codes WHERE email=?', [email])

const code = genCode()
await q(
  'INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
  [email, 'register', h(code, email, 'register')],
)
const reg = await call('POST', '/api/auth/register', { username, email, password, password2: password, code })
console.log('1. 注册        ', reg.status, reg.data.ok)
if (!reg.data.ok) process.exit(1)
const cookie = reg.cookie

const cats = await call('GET', '/api/categories')
console.log('2. 板块        ', cats.data.data.categories.map((c) => c.name).join(' / '))
const catId = cats.data.data.categories[0].id

const created = await call('POST', '/api/posts', { categoryId: catId, title: '第一帖测试', content: '这是正文。\n第二行。' }, cookie)
console.log('3. 发帖        ', created.status, JSON.stringify(created.data))
const postId = created.data.data.id

const detail = await call('GET', `/api/posts/${postId}`)
console.log('4. 详情        ', detail.status, detail.data.data.post.title, '| 浏览', detail.data.data.post.views)

const rep = await call('POST', `/api/posts/${postId}/replies`, { content: '第一条回复' }, cookie)
console.log('5. 回复        ', rep.status, rep.data.msg)

const again = await call('GET', `/api/posts/${postId}`)
console.log('6. 回复数      ', again.data.data.replies.length, '| 楼层:', again.data.data.replies[0]?.author.username)

const list = await call('GET', '/api/posts')
console.log('7. 列表        ', list.data.data.total, '帖 | 首条:', list.data.data.posts[0]?.title)

const anon = await call('POST', '/api/posts', { categoryId: catId, title: '匿名发帖', content: 'x' })
console.log('8. 未登录发帖  ', anon.status, anon.data.msg)

// 清理
await q('DELETE FROM replies WHERE post_id=?', [postId])
await q('DELETE FROM posts WHERE id=?', [postId])
await q('DELETE FROM users WHERE username=?', [username])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('9. 测试数据已清理')
process.exit(0)
