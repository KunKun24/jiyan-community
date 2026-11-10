import { Router } from 'express'
import { hitSensitive } from '../sensitive.js'
import { clientIp } from '../ratelimit.js'
import { one, q } from '../db.js'
import sanitizeHtml from 'sanitize-html'
import { sessionUser } from '../session.js'
import { notify, notifyReply } from '../notify.js'

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

const SANITIZE = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a', 'img', 'video', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'data-spoiler', 'data-width', 'class', 'width', 'height', 'style'],
    video: ['src', 'poster', 'controls', 'preload', 'class'],
    span: ['style', 'class'],
    p: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedStyles: {
    '*': { color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([^)]*\)$/i], width: [/^\d{1,3}%$/] },
  },
  disallowedTagsMode: 'discard',
}

function cleanHtml(html) {
  return sanitizeHtml(String(html || ''), SANITIZE).slice(0, 200000)
}

function firstImage(html) {
  const m = String(html || '').match(/<img[^>]+src="([^"]+)"/i)
  return m ? m[1] : null
}

function countImages(html) {
  return (String(html || '').match(/<img\b/gi) || []).length
}

function excerpt(text, n = 120) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n) + '…' : s
}

function authorOf(row) {
  return { id: row.user_id, username: row.username, avatar: row.avatar || null }
}

/** 板块列表 */
r.get('/categories', async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.id, c.name, c.slug, c.description,
              (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) AS post_count
         FROM categories c
        ORDER BY c.sort ASC, c.id ASC`,
    )
    return OK(res, { categories: rows })
  } catch (e) {
    console.error('[forum.categories]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 板块详情：板块信息 + 该板块下的标签 */
r.get('/categories/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim()
    const c = await one('SELECT id, name, slug, description FROM categories WHERE slug = ?', [slug])
    if (!c) return FAIL(res, '板块不存在', 404)

    const tags = await q(
      `SELECT t.name, COUNT(pt.post_id) AS cnt
         FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id
        WHERE t.category_id = ?
        GROUP BY t.id
        ORDER BY cnt DESC, t.name ASC
        LIMIT 30`,
      [c.id],
    )
    const cnt = await one('SELECT COUNT(*) AS total FROM posts WHERE category_id = ?', [c.id])
    return OK(res, {
      category: { ...c, post_count: Number(cnt.total) },
      tags: tags.map((t) => ({ name: t.name, count: Number(t.cnt) })),
    })
  } catch (e) {
    console.error('[forum.categoryDetail]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 帖子列表 ?category=slug&page=1&sort=new|active|hot */
r.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20))
    const offset = (page - 1) * size
    const category = String(req.query.category || '').trim()
    const tag = String(req.query.tag || '').trim()
    const sortIn = String(req.query.sort || 'new')
    const sort = ['new', 'active', 'hot', 'week', 'day'].includes(sortIn) ? sortIn : 'new'

    const where = ["p.status = 'public'"]
    const params = []
    if (category) {
      where.push('c.slug = ?')
      params.push(category)
    }
    if (tag) {
      where.push(
        'EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = ?)',
      )
      params.push(tag)
    }
    if (sort === 'week') where.push('p.created_at >= NOW() - INTERVAL 7 DAY')
    if (sort === 'day') where.push('p.created_at >= CURDATE()')
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderSql =
      sort === 'active'
        ? 'p.pinned DESC, p.last_reply_at DESC, p.created_at DESC'
        : sort === 'hot'
          ? 'p.pinned DESC, p.views DESC, p.reply_count DESC, p.created_at DESC'
          : sort === 'week' || sort === 'day'
            ? 'p.pinned DESC, p.views DESC, p.reply_count DESC'
            : 'p.pinned DESC, p.created_at DESC'

    const rows = await q(
      `SELECT p.id, p.title, p.content, p.content_html, p.views, p.reply_count, p.pinned, p.created_at, p.last_reply_at,
              p.user_id, u.username, u.avatar,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              (SELECT GROUP_CONCAT(t2.name ORDER BY t2.name SEPARATOR ',')
                 FROM post_tags pt2 JOIN tags t2 ON t2.id = pt2.tag_id
                WHERE pt2.post_id = p.id) AS tags
         FROM posts p
         JOIN users u ON u.id = p.user_id
         JOIN categories c ON c.id = p.category_id
         ${whereSql}
        ORDER BY ${orderSql}
        LIMIT ? OFFSET ?`,
      [...params, size, offset],
    )

    const totalRow = await one(
      `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON c.id = p.category_id ${whereSql}`,
      params,
    )

    return OK(res, {
      posts: rows.map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: excerpt(p.content),
        views: p.views,
        pinned: Number(p.pinned || 0),
        replyCount: p.reply_count,
        createdAt: p.created_at,
        lastReplyAt: p.last_reply_at,
        tags: p.tags || '',
        cover: firstImage(p.content_html),
        imageCount: countImages(p.content_html),
        author: authorOf(p),
        category: { id: p.category_id, name: p.category_name, slug: p.category_slug },
      })),
      total: Number(totalRow.total),
      page,
      pages: Math.max(1, Math.ceil(Number(totalRow.total) / size)),
    })
  } catch (e) {
    console.error('[forum.posts]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 发帖 */
r.post('/posts', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return

    const title = String(req.body?.title || '').trim()
    const content = String(req.body?.content || '').trim()
    const categoryId = Number(req.body?.categoryId || 0)

    if (title.length < 2 || title.length > 120) return FAIL(res, '标题需 2-120 字')
    if (content.length < 1) return FAIL(res, '正文不能为空')
    if (content.length > 20000) return FAIL(res, '正文过长')
    const badWord = await hitSensitive(`${title} ${content}`)
    if (badWord) return FAIL(res, `内容包含不适合发布的词：${badWord}`)

    const cat = await one('SELECT id FROM categories WHERE id=?', [categoryId])
    if (!cat) return FAIL(res, '板块不存在')

    const rawTags = Array.isArray(req.body?.tags) ? req.body.tags : []
    const tags = [...new Set(rawTags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 3)
    for (const name of tags) {
      if (name.length > 16) return FAIL(res, '单个标签最多 16 字')
      if (tags.length > 3) return FAIL(res, '最多 3 个标签')
    }

    const contentHtml = cleanHtml(req.body?.contentHtml)

    const ins = await q(
      'INSERT INTO posts (category_id, user_id, title, content, content_html) VALUES (?,?,?,?,?)',
      [categoryId, uid, title, content, contentHtml],
    )
    await q('UPDATE users SET points = points + 10 WHERE id = ?', [uid])

    for (const name of tags) {
      await q('INSERT INTO tags (category_id, name) VALUES (?,?) ON DUPLICATE KEY UPDATE id = id', [
        categoryId,
        name,
      ])
      const tg = await one('SELECT id FROM tags WHERE category_id=? AND name=?', [categoryId, name])
      if (tg) await q('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?,?)', [ins.insertId, tg.id])
    }

    return OK(res, { id: ins.insertId }, '发布成功')
  } catch (e) {
    console.error('[forum.createPost]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 帖子详情（浏览量 +1） */
r.get('/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return FAIL(res, '参数错误')
    const p = await one(
      `SELECT p.*, u.username, u.avatar, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         JOIN users u ON u.id = p.user_id
         JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?`,
      [id],
    )
    if (!p) return FAIL(res, '帖子不存在', 404)
    const s2 = sessionUser(req)
    if (p.status === 'private' && p.user_id !== s2?.uid) {
      return FAIL(res, '该帖子可能已被版主私密或删除', 404)
    }
    const viewerKey = s2?.uid ? `u:${s2.uid}` : `ip:${clientIp(req)}`
    const seen = await q('INSERT IGNORE INTO post_views (post_id, viewer) VALUES (?,?)', [id, viewerKey])
    const counted = Number(seen.affectedRows) === 1
    if (counted) await q('UPDATE posts SET views = views + 1 WHERE id = ?', [id])

    const tagRows = await q(
      `SELECT t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ? ORDER BY t.id`,
      [id],
    )

    const replies = await q(
      `SELECT r.id, r.content, r.created_at, r.user_id, u.username, u.avatar, r.like_count,
              r.parent_id, pu.username AS parent_username
         FROM replies r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN replies pr ON pr.id = r.parent_id
         LEFT JOIN users pu ON pu.id = pr.user_id
        WHERE r.post_id = ? ORDER BY r.id ASC`,
      [id],
    )

    const viewer = sessionUser(req)?.uid || 0
    const likedRow = viewer
      ? await one('SELECT 1 AS x FROM post_likes WHERE user_id=? AND post_id=?', [viewer, id])
      : null
    const bmRow = viewer
      ? await one('SELECT 1 AS x FROM bookmarks WHERE user_id=? AND post_id=?', [viewer, id])
      : null

    const myReplyLikes = new Set()
    if (viewer && replies.length) {
      const rl = await q(
        `SELECT reply_id FROM reply_likes WHERE user_id=? AND reply_id IN (${replies.map(() => '?').join(',')})`,
        [viewer, ...replies.map((x) => x.id)],
      )
      for (const x of rl) myReplyLikes.add(x.reply_id)
    }

    return OK(res, {
      post: {
        id: p.id,
        title: p.title,
        content: p.content,
        contentHtml: p.content_html || '',
        views: Number(p.views) + (counted ? 1 : 0),
        replyCount: replies.length,
        createdAt: p.created_at,
        likeCount: Number(p.like_count || 0),
        liked: !!likedRow,
        bookmarked: !!bmRow,
        status: p.status,
        tags: tagRows.map((x) => x.name),
        author: authorOf(p),
        category: { id: p.category_id, name: p.category_name, slug: p.category_slug },
      },
      replies: replies.map((x) => ({
        id: x.id,
        content: x.content,
        createdAt: x.created_at,
        parentId: x.parent_id || null,
        parentUsername: x.parent_username || null,
        likeCount: Number(x.like_count || 0),
        liked: myReplyLikes.has(x.id),
        author: authorOf(x),
      })),
    })
  } catch (e) {
    console.error('[forum.post]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 作者或管理员：改内容 / 改板块标签 / 设置公开私密 */
r.patch('/posts/:id', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    if (!id) return FAIL(res, '参数错误')

    const p = await one('SELECT * FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)
    const me = await one('SELECT role FROM users WHERE id=?', [uid])
    if (p.user_id !== uid && me?.role !== 'admin') return FAIL(res, '没有权限', 403)

    const body = req.body || {}
    const wantsEdit = ['title', 'content', 'contentHtml', 'categoryId', 'tags'].some((k) => k in body)
    const wantsStatus = 'status' in body

    if (!wantsEdit && !wantsStatus) return FAIL(res, '没有要修改的内容')

    let status = p.status
    if (wantsStatus) {
      status = String(body.status || '')
      if (!['public', 'private'].includes(status)) return FAIL(res, '状态只能是 public 或 private')
    }

    if (!wantsEdit) {
      await q('UPDATE posts SET status=? WHERE id=?', [status, id])
      return OK(res, { status }, status === 'private' ? '已设为私密' : '已公开')
    }

    const title = String(body.title ?? p.title).trim()
    const content = String(body.content ?? p.content).trim()
    if (title.length < 2 || title.length > 120) return FAIL(res, '标题需 2-120 字')
    if (!content) return FAIL(res, '正文不能为空')
    if (content.length > 20000) return FAIL(res, '正文过长')

    const categoryId = Number(body.categoryId || p.category_id)
    const cat = await one('SELECT id FROM categories WHERE id=?', [categoryId])
    if (!cat) return FAIL(res, '板块不存在')

    const contentHtml = 'contentHtml' in body ? cleanHtml(body.contentHtml) : p.content_html || ''

    await q('UPDATE posts SET title=?, content=?, content_html=?, category_id=?, status=? WHERE id=?', [
      title,
      content,
      contentHtml,
      categoryId,
      status,
      id,
    ])

    if (Array.isArray(body.tags)) {
      const tags = [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 3)
      for (const name of tags) {
        if (name.length > 16) return FAIL(res, '单个标签最多 16 字')
      }
      await q('DELETE FROM post_tags WHERE post_id=?', [id])
      for (const name of tags) {
        await q('INSERT INTO tags (category_id, name) VALUES (?,?) ON DUPLICATE KEY UPDATE id = id', [
          categoryId,
          name,
        ])
        const tg = await one('SELECT id FROM tags WHERE category_id=? AND name=?', [categoryId, name])
        if (tg) await q('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?,?)', [id, tg.id])
      }
    }

    return OK(res, { id }, '已保存')
  } catch (e) {
    console.error('[forum.patch]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 回复 */
r.post('/posts/:id/replies', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const content = String(req.body?.content || '').trim()
    if (!id) return FAIL(res, '参数错误')
    if (!content) return FAIL(res, '回复不能为空')
    if (content.length > 5000) return FAIL(res, '回复过长')
    const badWord = await hitSensitive(content)
    if (badWord) return FAIL(res, `回复包含不适合发布的词：${badWord}`)

    const p = await one('SELECT id, user_id, title FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)

    let parentId = Number(req.body?.parentId || 0) || null
    let parentUserId = null
    if (parentId) {
      const parent = await one('SELECT id, user_id FROM replies WHERE id=? AND post_id=?', [parentId, id])
      if (parent) parentUserId = parent.user_id
      else parentId = null
    }

    const ins = await q('INSERT INTO replies (post_id, user_id, content, parent_id) VALUES (?,?,?,?)', [
      id,
      uid,
      content,
      parentId,
    ])
    await q('UPDATE posts SET reply_count = reply_count + 1, last_reply_at = NOW() WHERE id = ?', [id])
    await q('UPDATE users SET points = points + 2 WHERE id = ?', [uid])
    const me = await one('SELECT username FROM users WHERE id=?', [uid])
    await notifyReply({
      postId: id,
      replyId: ins.insertId,
      postOwnerId: p.user_id,
      parentUserId,
      actorId: uid,
      actorName: me?.username || '有人',
      text: content,
    })
    return OK(res, { id: ins.insertId }, '回复成功')
  } catch (e) {
    console.error('[forum.reply]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 点赞 / 取消点赞 */
r.post('/posts/:id/like', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const p = await one('SELECT id, user_id FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)
    if (p.user_id === uid) return FAIL(res, '不能给自己点赞')

    const liked = await one('SELECT 1 AS x FROM post_likes WHERE user_id=? AND post_id=?', [uid, id])
    if (liked) {
      await q('DELETE FROM post_likes WHERE user_id=? AND post_id=?', [uid, id])
      await q('UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id=?', [id])
      await q('UPDATE users SET likes_received = GREATEST(likes_received - 2, 0) WHERE id=?', [p.user_id])
    } else {
      await q('INSERT IGNORE INTO post_likes (user_id, post_id) VALUES (?,?)', [uid, id])
      await q('UPDATE posts SET like_count = like_count + 1 WHERE id=?', [id])
      await q('UPDATE users SET likes_received = likes_received + 2 WHERE id=?', [p.user_id])
      const who = await one('SELECT username FROM users WHERE id=?', [uid])
      await notify({ userId: p.user_id, actorId: uid, type: 'like', postId: id, body: `${who?.username || '有人'} 赞了你的帖子` })
    }
    const row = await one('SELECT like_count FROM posts WHERE id=?', [id])
    return OK(res, { liked: !liked, likeCount: Number(row.like_count) })
  } catch (e) {
    console.error('[forum.like]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 评论点赞 / 取消 */
r.post('/replies/:id/like', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const rep = await one('SELECT id, user_id, post_id FROM replies WHERE id=?', [id])
    if (!rep) return FAIL(res, '评论不存在', 404)
    if (rep.user_id === uid) return FAIL(res, '不能给自己点赞')

    const liked = await one('SELECT 1 AS x FROM reply_likes WHERE user_id=? AND reply_id=?', [uid, id])
    if (liked) {
      await q('DELETE FROM reply_likes WHERE user_id=? AND reply_id=?', [uid, id])
      await q('UPDATE replies SET like_count = GREATEST(like_count - 1, 0) WHERE id=?', [id])
    } else {
      await q('INSERT IGNORE INTO reply_likes (user_id, reply_id) VALUES (?,?)', [uid, id])
      await q('UPDATE replies SET like_count = like_count + 1 WHERE id=?', [id])
      const who = await one('SELECT username FROM users WHERE id=?', [uid])
      await notify({ userId: rep.user_id, actorId: uid, type: 'reply_like', postId: rep.post_id, replyId: id, body: `${who?.username || '有人'} 赞了你的评论` })
    }
    const row = await one('SELECT like_count FROM replies WHERE id=?', [id])
    return OK(res, { liked: !liked, likeCount: Number(row.like_count) })
  } catch (e) {
    console.error('[forum.replyLike]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 分享（每人每帖记一次） */
r.post('/posts/:id/share', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const p = await one('SELECT id, user_id FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)

    const ins = await q('INSERT IGNORE INTO share_logs (user_id, post_id) VALUES (?,?)', [uid, id])
    if (ins.affectedRows > 0) {
      await q('UPDATE users SET share_count = share_count + 2 WHERE id=?', [p.user_id])
    }
    const row = await one('SELECT share_count FROM users WHERE id=?', [p.user_id])
    return OK(res, { shareCount: Number(row.share_count) })
  } catch (e) {
    console.error('[forum.share]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 收藏 / 取消收藏 */
r.post('/posts/:id/bookmark', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const p = await one('SELECT id FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)

    const bm = await one('SELECT 1 AS x FROM bookmarks WHERE user_id=? AND post_id=?', [uid, id])
    if (bm) {
      await q('DELETE FROM bookmarks WHERE user_id=? AND post_id=?', [uid, id])
      return OK(res, { bookmarked: false })
    }
    await q('INSERT IGNORE INTO bookmarks (user_id, post_id) VALUES (?,?)', [uid, id])
    return OK(res, { bookmarked: true })
  } catch (e) {
    console.error('[forum.bookmark]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 删除帖子（真删） */
r.delete('/posts/:id', async (req, res) => {
  try {
    const uid = needLogin(req, res)
    if (!uid) return
    const id = Number(req.params.id)
    const p = await one('SELECT id, user_id FROM posts WHERE id=?', [id])
    if (!p) return FAIL(res, '帖子不存在', 404)

    const u = await one('SELECT role FROM users WHERE id=?', [uid])
    if (p.user_id !== uid && u?.role !== 'admin') return FAIL(res, '没有权限删除', 403)

    await q('DELETE FROM replies WHERE post_id=?', [id])
    await q('DELETE FROM post_tags WHERE post_id=?', [id])
    await q('DELETE FROM post_likes WHERE post_id=?', [id])
    await q('DELETE FROM share_logs WHERE post_id=?', [id])
    await q('DELETE FROM bookmarks WHERE post_id=?', [id])
    await q('DELETE FROM posts WHERE id=?', [id])
    return OK(res, {}, '帖子已删除')
  } catch (e) {
    console.error('[forum.delete]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

export default r
