import { createHash } from 'node:crypto'
import { genCode } from '../src/code.js'
import { q } from '../src/db.js'

const BASE = 'http://127.0.0.1:3000'
const h = (c, e, p) => createHash('sha256').update(`${c}|${e}|${p}`).digest('hex')
let cookie = ''
async function call(method, path, body) {
  const init = { method, headers: {} }
  if (cookie) init.headers.cookie = cookie
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, init)
  const sc = res.headers.get('set-cookie')
  if (sc) cookie = sc.split(';')[0]
  return res.json()
}
const email = `r2${Date.now()}@test.local`
const username = `回归${Date.now() % 10000}`
await q('DELETE FROM email_codes WHERE email=?', [email])
const code = genCode()
await q('INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [email, 'register', h(code, email, 'register')])
const reg = await call('POST', '/api/auth/register', { username, email, password: 'test123456', password2: 'test123456', code })
if (!reg.ok) throw new Error(reg.msg)
const uid = reg.data.user.id

const p1 = await call('POST', '/api/posts', { categoryId: 1, title: '回归测试帖', content: 'x', contentHtml: '<p>hi</p>', tags: [] })
const pid = p1.data.id
const r1 = await call('POST', `/api/posts/${pid}/replies`, { content: '一层' })
const list1 = await call('GET', `/api/posts/${pid}`)
const first = list1.data.replies[0]
const r2 = await call('POST', `/api/posts/${pid}/replies`, { content: '二层', parentId: first.id })
const list2 = await call('GET', `/api/posts/${pid}`)
const second = list2.data.replies.find((r) => r.content === '二层')
console.log('parent link:', second.parentUsername === username, '| status:', second.parentId === first.id)

const pat = await call('PATCH', `/api/posts/${pid}`, { status: 'private' })
const det = await call('GET', `/api/posts/${pid}`)
console.log('private ok:', pat.ok, '| detail status:', det.data?.post?.status)
const otherCookie = cookie
cookie = ''
const anon = await call('GET', `/api/posts/${pid}`)
console.log('anon 404:', anon.ok === false)
cookie = otherCookie
await call('PATCH', `/api/posts/${pid}`, { status: 'public' })

const nowRow = await q('SELECT NOW() n')
console.log('db now:', nowRow[0].n, '| tz:', (await q("SELECT @@session.time_zone tz"))[0].tz)
const pw = await call('POST', '/api/posts', { categoryId: 1, title: '宽度测试', content: 'w', contentHtml: '<img src="/uploads/media/x.png" data-width="50" style="width:50%"/>' })
const pd = await call('GET', `/api/posts/${pw.data.id}`)
console.log('width kept:', /data-width="50"/.test(pd.data.post.contentHtml))
const wl = await call('GET', '/api/posts?size=5')
console.log('created_at sample:', wl.data.posts[0].createdAt)

await q('DELETE FROM posts WHERE user_id=?', [uid])
await q('DELETE FROM users WHERE id=?', [uid])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('cleanup')
process.exit(0)
