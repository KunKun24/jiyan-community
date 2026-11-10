import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { genCode } from '../src/code.js'
import { q } from '../src/db.js'

const BASE = 'http://127.0.0.1:3000'
const h = (code, email, purpose) => createHash('sha256').update(`${code}|${email}|${purpose}`).digest('hex')
let cookie = ''

async function call(method, path, body, raw) {
  const init = { method, headers: {} }
  if (cookie) init.headers.cookie = cookie
  if (raw) {
    init.body = raw
  } else if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, init)
  const sc = res.headers.get('set-cookie')
  if (sc) cookie = sc.split(';')[0]
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { ok: false, msg: text.slice(0, 200) }
  }
}

const email = `rich${Date.now()}@test.local`
const username = `富文本${Date.now() % 10000}`
const password = 'test123456'

await q('DELETE FROM email_codes WHERE email=?', [email])
const code = genCode()
await q(
  'INSERT INTO email_codes (email,purpose,code_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
  [email, 'register', h(code, email, 'register')],
)
const reg = await call('POST', '/api/auth/register', { username, email, password, password2: password, code })
if (!reg.ok) throw new Error('register: ' + reg.msg)

// 上传图片
const fd = new FormData()
fd.append('file', new Blob([fs.readFileSync('/www/wwwroot/极验社区/web/public/logo.png')], { type: 'image/png' }), 'logo.png')
const up = await call('POST', '/api/upload/image', undefined, fd)
console.log('upload:', up.ok, up.data?.url || up.msg)
if (!up.ok) throw new Error('upload failed')

const html = `<h2>富文本标题</h2><p>你好 <span style="color:#b8386f">粉色文字</span> <u>下划线</u></p>
<p><a href="https://github.com/KunKun24/jiyan-community">github</a> 与 <a href="https://123pan.com/s/abc">123网盘</a></p>
<img src="${up.data.url}" data-spoiler="1" class="img-spoiler"><script>alert(1)</script><img src="x" onerror="alert(1)">`

const post = await call('POST', '/api/posts', { categoryId: 1, title: '富文本测试帖', content: '富文本测试', contentHtml: html, tags: ['测试'] })
console.log('post:', post.ok, post.data?.id || post.msg)
const pid = post.data.id

const detail = await call('GET', `/api/posts/${pid}`)
const ch = detail.data.post.contentHtml || ''
console.log('has img:', ch.includes(up.data.url))
console.log('has spoiler:', ch.includes('data-spoiler'))
console.log('has color:', ch.includes('color:#b8386f') || ch.includes('color:#B8386F'))
console.log('script stripped:', !ch.toLowerCase().includes('<script'))
console.log('onerror stripped:', !ch.toLowerCase().includes('onerror'))
console.log('video tag allowed:', (await call('POST', '/api/posts', { categoryId: 1, title: '视频测试', content: 'v', contentHtml: '<video src="/uploads/media/x.mp4" controls></video>' })).ok)

const list = await call('GET', '/api/posts?size=5')
const row = (list.data.posts || []).find((p) => p.id === pid)
console.log('list cover:', row?.cover === up.data.url, 'imageCount:', row?.imageCount)

await q('DELETE FROM posts WHERE user_id=?', [reg.data.user.id])
await q('DELETE FROM users WHERE id=?', [reg.data.user.id])
await q('DELETE FROM email_codes WHERE email=?', [email])
console.log('cleanup done')
