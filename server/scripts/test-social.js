import 'dotenv/config'
import { q, one } from '../src/db.js'
import { hashPassword } from '../src/password.js'

const BASE = 'http://127.0.0.1:3000'

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const setCookie = res.headers.getSetCookie?.() || []
  const json = await res.json()
  const c = setCookie.map((x) => x.split(';')[0]).join('; ')
  return { ...json, cookie: c || cookie }
}

async function makeUser(name) {
  await q('DELETE FROM users WHERE username IN (?,?)', [name + '_a', name + '_b'])
  const hash = await hashPassword('123456')
  const r = await q(
    "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
    [name + '_a', name + '_a@test.local', hash],
  )
  const b = await q(
    "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
    [name + '_b', name + '_b@test.local', hash],
  )
  const la = await call('/api/auth/login', { method: 'POST', body: { account: name + '_a', password: '123456' } })
  const lb = await call('/api/auth/login', { method: 'POST', body: { account: name + '_b', password: '123456' } })
  return { a: r.insertId, b: b.insertId, ca: la.cookie, cb: lb.cookie }
}

const us = await makeUser('soc' + Date.now().toString().slice(-5))
const ids = []

// A 发帖
const cat = await one('SELECT id FROM categories ORDER BY sort ASC LIMIT 1')
const post = await call('/api/posts', {
  method: 'POST',
  cookie: us.ca,
  body: { title: '通知测试帖', content: 'hello @' + 'soc', categoryId: cat.id, contentHtml: '<p>hello</p>' },
})
console.log('create post:', post.ok, post.msg, post.data?.id)
ids.push(post.data.id)

// B 回复
const rep = await call(`/api/posts/${post.data.id}/replies`, {
  method: 'POST', cookie: us.cb, body: { content: '我也来说一句' },
})
console.log('reply:', rep.ok, rep.msg)
// B 点赞帖子
const like = await call(`/api/posts/${post.data.id}/like`, { method: 'POST', cookie: us.cb })
console.log('like:', like.ok, like.data)
// A 点赞 B 的评论
const rl = await call(`/api/replies/${rep.data.id}/like`, { method: 'POST', cookie: us.ca })
console.log('reply like:', rl.ok, rl.data)

// A 的通知
const nt = await call('/api/notifications', { cookie: us.ca })
console.log('notifications:', nt.ok, nt.data.items.map((x) => x.type), 'unread=', nt.data.unread)
const cnt = await call('/api/notifications/count', { cookie: us.ca })
console.log('count:', cnt.data)

// A 编辑帖子
const ed = await call(`/api/posts/${post.data.id}`, {
  method: 'PATCH', cookie: us.ca, body: { title: '通知测试帖（改过）', content: 'hello edited', contentHtml: '<p>hello edited</p>' },
})
console.log('edit:', ed.ok, ed.msg)
const detail = await call(`/api/posts/${post.data.id}`, { cookie: us.ca })
console.log('edited title:', detail.data.post.title, '| html:', detail.data.post.contentHtml)

// 搜索
const sp = await call('/api/search?q=' + encodeURIComponent('通知测试'))
console.log('search posts:', sp.data.items.length, sp.data.items[0]?.title)
const su = await call('/api/search?q=' + encodeURIComponent('soc') + '&type=users')
console.log('search users:', su.data.items.length)
const usr = await call('/api/users/search?q=' + encodeURIComponent('soc'))
console.log('user suggest:', usr.data.items.length)

// 作者主页
const home = await call(`/api/users/${us.a}`)
console.log('user home:', home.ok, home.data.user.username, 'posts=', home.data.posts.length)

// 举报评论（多选）
const rp = await call('/api/reports', {
  method: 'POST', cookie: us.cb,
  body: { targetType: 'comment', targetIds: [rep.data.id], postId: post.data.id, reason: '这是一条测试举报', contact: 'me@test.local' },
})
console.log('report:', rp.ok, rp.msg, rp.data)

// 清理
await q('DELETE FROM notifications WHERE user_id IN (?,?)', [us.a, us.b])
await q('DELETE FROM reports WHERE reporter_id IN (?,?)', [us.a, us.b])
await q('DELETE FROM reply_likes WHERE reply_id IN (SELECT id FROM replies WHERE post_id=?)', [post.data.id])
await q('DELETE FROM replies WHERE post_id=?', [post.data.id])
await q('DELETE FROM post_likes WHERE post_id=?', [post.data.id])
await q('DELETE FROM post_tags WHERE post_id=?', [post.data.id])
await q('DELETE FROM posts WHERE id=?', [post.data.id])
await q('DELETE FROM users WHERE id IN (?,?)', [us.a, us.b])
console.log('cleaned')
process.exit(0)
