import { Router } from 'express'
import { one, q } from '../db.js'
import { sessionUser } from '../session.js'
import { levelOf, growthOf } from '../level.js'
import { notify } from '../notify.js'

const r = Router()
const OK = (res, data = {}, msg = 'ok') => res.json({ ok: true, msg, data })
const FAIL = (res, msg, code = 400) => res.status(code).json({ ok: false, msg })

function needLogin(req, res) {
  const s = sessionUser(req)
  if (!s?.uid) {
    FAIL(res, '请先登录', 401)
    return null
  }
  return s.uid
}

function authorOf(u) {
  return { id: u.id ?? u.user_id, username: u.username, avatar: u.avatar || null }
}

/* ---------------- 通知 ---------------- */

r.get('/notifications', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20))
    const page = Math.max(1, Number(req.query.page) || 1)
    const rows = await q(
      `SELECT n.*, u.username AS actor_name, u.avatar AS actor_avatar, p.title AS post_title
         FROM notifications n
         LEFT JOIN users u ON u.id = n.actor_id
         LEFT JOIN posts p ON p.id = n.post_id
        WHERE n.user_id = ?
        ORDER BY n.id DESC
        LIMIT ? OFFSET ?`,
      [uid, size, (page - 1) * size],
    )
    const unread = await one(
      'SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND read_at IS NULL',
      [uid],
    )
    return OK(res, {
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        body: n.body,
        read: !!n.read_at,
        createdAt: n.created_at,
        postId: n.post_id,
        postTitle: n.post_title,
        replyId: n.reply_id,
        actor: n.actor_id ? { id: n.actor_id, username: n.actor_name, avatar: n.actor_avatar } : null,
      })),
      unread: Number(unread?.c || 0),
      page,
      size,
    })
  } catch (e) {
    console.error('[social.notifications]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/notifications/count', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const row = await one('SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND read_at IS NULL', [uid])
    return OK(res, { unread: Number(row?.c || 0) })
  } catch (e) {
    console.error('[social.count]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/notifications/read', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : []
    if (req.body?.all || !ids.length) {
      await q('UPDATE notifications SET read_at = NOW() WHERE user_id=? AND read_at IS NULL', [uid])
    } else {
      await q(
        `UPDATE notifications SET read_at = NOW() WHERE user_id=? AND read_at IS NULL AND id IN (${ids
          .map(() => '?')
          .join(',')})`,
        [uid, ...ids],
      )
    }
    return OK(res, {}, '已读')
  } catch (e) {
    console.error('[social.read]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 举报 ---------------- */

r.post('/reports', async (req, res) => {
  try {
    const uid = requireLoginOrAnon(req)
    const tt = String(req.body?.targetType || 'post')
    const targetType = ['post', 'comment', 'user'].includes(tt) ? tt : 'post'
    const reason = String(req.body?.reason || '').trim()
    const contact = String(req.body?.contact || '').trim().slice(0, 120)
    const postId = Number(req.body?.postId || 0) || null
    const raw = req.body?.targetIds
    const ids = (Array.isArray(raw) ? raw : [req.body?.targetId]).map(Number).filter(Boolean)
    if (!ids.length) return FAIL(res, '要举报的对象不存在')
    if (reason.length < 5) return FAIL(res, '请把原因写清楚一点（至少 5 个字）')
    if (reason.length > 500) return FAIL(res, '原因太长了')
    if (targetType === 'comment' && !postId) return FAIL(res, '参数错误')
    if (targetType === 'user' && !uid) return FAIL(res, '登录后才能举报用户')

    let done = 0
    for (const tid of ids.slice(0, 50)) {
      if (targetType === 'post') {
        const p = await one('SELECT id FROM posts WHERE id=?', [tid])
        if (!p) continue
      } else if (targetType === 'user') {
        if (tid === uid) continue
        const u = await one('SELECT id FROM users WHERE id=?', [tid])
        if (!u) continue
      } else {
        const c = await one('SELECT id FROM replies WHERE id=?', [tid])
        if (!c) continue
      }
      await q(
        'INSERT INTO reports (target_type, target_id, post_id, reporter_id, reason, contact) VALUES (?,?,?,?,?,?)',
        [targetType, tid, postId, uid || 0, reason, contact || null],
      )
      done++
    }
    if (!done) return FAIL(res, '要举报的对象不存在')
    return OK(res, { count: done }, '已收到举报，谢谢')
  } catch (e) {
    console.error('[social.report]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 轮播图（公开） ---------------- */
r.get('/banners', async (_req, res) => {
  try {
    const rows = await q(
      'SELECT id, image, link, title FROM banners WHERE enabled=1 ORDER BY sort ASC, id DESC LIMIT 10',
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[social.banners]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

function requireLoginOrAnon(req) {
  return sessionUser(req)?.uid || 0
}

r.get('/reports', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const me = await one('SELECT role FROM users WHERE id=?', [uid])
    if (me?.role !== 'admin') return FAIL(res, '没有权限', 403)
    const rows = await q(
      `SELECT r.*, u.username AS reporter, p.title AS post_title
         FROM reports r
         LEFT JOIN users u ON u.id = r.reporter_id
         LEFT JOIN posts p ON p.id = r.post_id
        WHERE r.status = 'pending'
        ORDER BY r.id DESC LIMIT 200`,
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[social.reports]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 搜索 ---------------- */

r.get('/search', async (req, res) => {
  try {
    const keyword = String(req.query.q || '').trim().slice(0, 50)
    const type = req.query.type === 'users' ? 'users' : 'posts'
    if (!keyword) return OK(res, { items: [] })
    const like = `%${keyword}%`
    if (type === 'users') {
      const rows = await q(
        `SELECT u.id, u.username, u.avatar, u.bio,
                (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id AND p.status='public') AS post_count
           FROM users u WHERE u.username LIKE ? ORDER BY u.id ASC LIMIT 30`,
        [like],
      )
      return OK(res, { items: rows.map((u) => ({ ...u, post_count: Number(u.post_count) })) })
    }
    const rows = await q(
      `SELECT p.id, p.title, p.content, p.views, p.reply_count, p.like_count, p.created_at,
              u.username, u.avatar, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         JOIN users u ON u.id = p.user_id
         JOIN categories c ON c.id = p.category_id
        WHERE p.status='public' AND (p.title LIKE ? OR p.content LIKE ?)
        ORDER BY p.views DESC, p.id DESC LIMIT 30`,
      [like, like],
    )
    return OK(res, {
      items: rows.map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: String(p.content || '').slice(0, 80),
        views: p.views,
        replyCount: p.reply_count,
        likeCount: p.like_count,
        createdAt: p.created_at,
        author: { username: p.username, avatar: p.avatar },
        category: { name: p.category_name, slug: p.category_slug },
      })),
    })
  } catch (e) {
    console.error('[social.search]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 用户主页 / 用户搜索 ---------------- */

r.get('/users/search', async (req, res) => {
  try {
    const keyword = String(req.query.q || '').trim().slice(0, 32)
    if (!keyword) return OK(res, { items: [] })
    const rows = await q(
      'SELECT id, username, avatar FROM users WHERE username LIKE ? ORDER BY id ASC LIMIT 8',
      [`%${keyword}%`],
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[social.userSearch]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return FAIL(res, '参数错误')
    const u = await one('SELECT * FROM users WHERE id=?', [id])
    if (!u) return FAIL(res, '用户不存在', 404)
    const pcount = await one(
      "SELECT COUNT(*) AS c FROM posts WHERE user_id=? AND status='public'",
      [id],
    )
    const rcount = await one('SELECT COUNT(*) AS c FROM replies WHERE user_id=?', [id])
    const level = levelOf(growthOf(u))
    const viewer = sessionUser(req)?.uid || 0
    const fc = await one('SELECT COUNT(*) AS c FROM follows WHERE following_id=?', [id])
    const fg = await one('SELECT COUNT(*) AS c FROM follows WHERE follower_id=?', [id])
    const isFollowing = viewer
      ? await one('SELECT 1 AS x FROM follows WHERE follower_id=? AND following_id=?', [viewer, id])
      : null
    const posts = await q(
      `SELECT p.id, p.title, p.views, p.reply_count, p.like_count, p.created_at,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT content_html FROM posts WHERE id=p.id) AS content_html
         FROM posts p JOIN categories c ON c.id=p.category_id
        WHERE p.user_id=? AND p.status='public'
        ORDER BY p.id DESC LIMIT 30`,
      [id],
    )
    return OK(res, {
      user: {
        id: u.id,
        username: u.username,
        avatar: u.avatar || null,
        bio: u.bio || '',
        location: u.location || '',
        website: u.website || '',
        contact: u.contact || '',
        createdAt: u.created_at,
        isMe: viewer === u.id,
        isFollowing: !!isFollowing,
        level,
      },
      stats: {
        posts: Number(pcount?.c || 0),
        replies: Number(rcount?.c || 0),
        likes: Number(u.likes_received || 0),
        followers: Number(fc?.c || 0),
        following: Number(fg?.c || 0),
      },
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        views: p.views,
        replyCount: p.reply_count,
        likeCount: p.like_count,
        createdAt: p.created_at,
        category: { name: p.category_name, slug: p.category_slug },
        cover: firstImage(p.content_html),
        imageCount: countImages(p.content_html),
      })),
    })
  } catch (e) {
    console.error('[social.userHome]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

function firstImage(html) {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(String(html || ''))
  return m ? m[1] : null
}
function countImages(html) {
  return (String(html || '').match(/<img\b/gi) || []).length
}

/* ---------------- 关注 ---------------- */

r.post('/follows/:uid', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const target = Number(req.params.uid)
    if (!target || target === uid) return FAIL(res, '不能关注自己')
    const u = await one('SELECT id FROM users WHERE id=?', [target])
    if (!u) return FAIL(res, '用户不存在', 404)
    const exists = await one('SELECT 1 AS x FROM follows WHERE follower_id=? AND following_id=?', [uid, target])
    if (exists) {
      await q('DELETE FROM follows WHERE follower_id=? AND following_id=?', [uid, target])
      return OK(res, { following: false }, '已取消关注')
    }
    await q('INSERT INTO follows (follower_id, following_id) VALUES (?,?)', [uid, target])
    return OK(res, { following: true }, '已关注')
  } catch (e) {
    console.error('[social.follow]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/feed/following', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const rows = await q(
      `SELECT p.id, p.title, p.content, p.content_html, p.views, p.reply_count, p.pinned, p.created_at,
              u.id AS user_id, u.username, u.avatar, c.name AS category_name, c.slug AS category_slug
         FROM follows f
         JOIN posts p ON p.user_id = f.following_id AND p.status='public'
         JOIN users u ON u.id = p.user_id
         JOIN categories c ON c.id = p.category_id
        WHERE f.follower_id=?
        ORDER BY p.created_at DESC LIMIT 50`,
      [uid],
    )
    return OK(res, {
      posts: rows.map((p) => ({
        id: p.id,
        title: p.title,
        views: p.views,
        pinned: Number(p.pinned || 0),
        replyCount: p.reply_count,
        createdAt: p.created_at,
        author: { id: p.user_id, username: p.username, avatar: p.avatar },
        category: { name: p.category_name, slug: p.category_slug },
      })),
    })
  } catch (e) {
    console.error('[social.feed]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 私信 ---------------- */

async function convOf(id, uid) {
  const c = await one('SELECT * FROM conversations WHERE id=?', [id])
  if (!c) return null
  if (c.user_a !== uid && c.user_b !== uid) return null
  return c
}
const otherOf = (c, uid) => (c.user_a === uid ? c.user_b : c.user_a)

r.get('/conversations', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const rows = await q(
      `SELECT c.id, c.user_a, c.user_b, c.last_message_at,
              IF(c.user_a=?, c.user_b, c.user_a) AS other_id,
              (SELECT username FROM users WHERE id=IF(c.user_a=?, c.user_b, c.user_a)) AS other_name,
              (SELECT avatar FROM users WHERE id=IF(c.user_a=?, c.user_b, c.user_a)) AS other_avatar,
              (SELECT content FROM messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_text,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.read_at IS NULL) AS unread
         FROM conversations c
        WHERE c.user_a=? OR c.user_b=?
        ORDER BY c.last_message_at DESC LIMIT 50`,
      [uid, uid, uid, uid, uid, uid],
    )
    return OK(res, {
      items: rows.map((c) => ({
        id: c.id,
        otherId: c.other_id,
        otherName: c.other_name,
        otherAvatar: c.other_avatar,
        lastText: c.last_text || '',
        lastAt: c.last_message_at,
        unread: Number(c.unread || 0),
      })),
    })
  } catch (e) {
    console.error('[social.conversations]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/conversations', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const target = Number(req.body?.userId)
    if (!target || target === uid) return FAIL(res, '不能和自己私信')
    const u = await one('SELECT id FROM users WHERE id=?', [target])
    if (!u) return FAIL(res, '用户不存在', 404)
    const a = Math.min(uid, target)
    const b = Math.max(uid, target)
    let c = await one('SELECT * FROM conversations WHERE user_a=? AND user_b=?', [a, b])
    if (!c) {
      const ins = await q('INSERT INTO conversations (user_a, user_b) VALUES (?,?)', [a, b])
      c = await one('SELECT * FROM conversations WHERE id=?', [ins.insertId])
    }
    return OK(res, { conversationId: c.id })
  } catch (e) {
    console.error('[social.createConv]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/conversations/:id/messages', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const c = await convOf(Number(req.params.id), uid)
    if (!c) return FAIL(res, '会话不存在', 404)
    const rows = await q(
      'SELECT id, sender_id, content, read_at, created_at FROM messages WHERE conversation_id=? ORDER BY id ASC LIMIT 500',
      [c.id],
    )
    await q('UPDATE messages SET read_at=NOW() WHERE conversation_id=? AND sender_id<>? AND read_at IS NULL', [c.id, uid])
    return OK(res, { items: rows, otherId: otherOf(c, uid) })
  } catch (e) {
    console.error('[social.messages]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/conversations/:id/messages', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const c = await convOf(Number(req.params.id), uid)
    if (!c) return FAIL(res, '会话不存在', 404)
    const content = String(req.body?.content || '').trim().slice(0, 2000)
    if (!content) return FAIL(res, '说点什么吧')
    const { hitSensitive } = await import('../sensitive.js')
    const badWord = await hitSensitive(content)
    if (badWord) return FAIL(res, `消息包含不适合发送的词：${badWord}`)
    const ins = await q('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?,?,?)', [
      c.id, uid, content,
    ])
    await q('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [c.id])
    const other = otherOf(c, uid)
    const { pushTo } = await import('../rt.js')
    const me = await one('SELECT username FROM users WHERE id=?', [uid])
    pushTo(other, {
      type: 'message',
      conversationId: c.id,
      message: {
        id: ins.insertId,
        senderId: uid,
        senderName: me?.username || '',
        content,
        createdAt: new Date().toISOString(),
      },
    })
    return OK(res, { id: ins.insertId }, '已发送')
  } catch (e) {
    console.error('[social.sendMessage]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/messages/unread-count', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const row = await one(
      `SELECT COUNT(*) AS c FROM messages m JOIN conversations c ON c.id=m.conversation_id
        WHERE (c.user_a=? OR c.user_b=?) AND m.sender_id<>? AND m.read_at IS NULL`,
      [uid, uid, uid],
    )
    return OK(res, { count: Number(row?.c || 0) })
  } catch (e) {
    console.error('[social.unread]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.get('/online/count', async (_req, res) => {
  try {
    const { onlineCount } = await import('../rt.js')
    return OK(res, { count: onlineCount() })
  } catch {
    return OK(res, { count: 0 })
  }
})

export { notify }
export default r
