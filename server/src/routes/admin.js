import { Router } from 'express'
import { one, q } from '../db.js'
import { sessionUser } from '../session.js'

const r = Router()
const OK = (res, data = {}, msg = 'ok') => res.json({ ok: true, msg, data })
const FAIL = (res, msg, code = 400) => res.status(code).json({ ok: false, msg })

r.use((req, res, next) => {
  const s = sessionUser(req)
  if (!s?.uid) return FAIL(res, '请先登录', 401)
  one('SELECT id, username, role, status FROM users WHERE id=?', [s.uid])
    .then((u) => {
      if (!u || Number(u.status) !== 1) return FAIL(res, '账号不可用', 401)
      if (u.role !== 'admin') return FAIL(res, '没有管理员权限', 403)
      req.admin = u
      next()
    })
    .catch((e) => {
      console.error('[admin.auth]', e)
      FAIL(res, '服务器错误', 500)
    })
})

/** 总览 */
r.get('/admin/stats', async (_req, res) => {
  try {
    const s = await one(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at)=CURDATE()) AS todayUsers,
        (SELECT COUNT(*) FROM posts) AS posts,
        (SELECT COUNT(*) FROM posts WHERE status='public') AS publicPosts,
        (SELECT COUNT(*) FROM posts WHERE DATE(created_at)=CURDATE()) AS todayPosts,
        (SELECT COUNT(*) FROM replies) AS replies,
        (SELECT COUNT(*) FROM reports WHERE status='pending') AS pendingReports
    `)
    const recent = await q(
      `SELECT p.id, p.title, p.created_at, p.status, u.username
         FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.id DESC LIMIT 8`,
    )
    return OK(res, { ...s, recent })
  } catch (e) {
    console.error('[admin.stats]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 帖子列表（含私密） */
r.get('/admin/posts', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20))
    const keyword = String(req.query.q || '').trim().slice(0, 50)
    const status = String(req.query.status || '').trim()
    const where = []
    const params = []
    if (keyword) {
      where.push('(p.title LIKE ? OR u.username LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (status === 'public' || status === 'private') {
      where.push('p.status = ?')
      params.push(status)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await q(
      `SELECT p.id, p.title, p.status, p.views, p.reply_count, p.created_at, p.user_id,
              u.username, c.name AS category_name, c.slug AS category_slug
         FROM posts p JOIN users u ON u.id=p.user_id JOIN categories c ON c.id=p.category_id
         ${whereSql} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, size, (page - 1) * size],
    )
    const total = await one(
      `SELECT COUNT(*) AS c FROM posts p JOIN users u ON u.id=p.user_id ${whereSql}`,
      params,
    )
    return OK(res, {
      items: rows.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        views: p.views,
        replyCount: p.reply_count,
        createdAt: p.created_at,
        userId: p.user_id,
        username: p.username,
        category: { name: p.category_name, slug: p.category_slug },
      })),
      total: Number(total?.c || 0),
      page,
      size,
    })
  } catch (e) {
    console.error('[admin.posts]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.patch('/admin/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const status = String(req.body?.status || '')
    if (!id) return FAIL(res, '参数错误')
    if (!['public', 'private'].includes(status)) return FAIL(res, '状态不合法')
    await q('UPDATE posts SET status=? WHERE id=?', [status, id])
    return OK(res, { status }, status === 'private' ? '已设为私密' : '已公开')
  } catch (e) {
    console.error('[admin.patchPost]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.delete('/admin/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return FAIL(res, '参数错误')
    await q('DELETE FROM replies WHERE post_id=?', [id])
    await q('DELETE FROM post_tags WHERE post_id=?', [id])
    await q('DELETE FROM post_likes WHERE post_id=?', [id])
    await q('DELETE FROM share_logs WHERE post_id=?', [id])
    await q('DELETE FROM bookmarks WHERE post_id=?', [id])
    await q('DELETE FROM notifications WHERE post_id=?', [id])
    await q('DELETE FROM posts WHERE id=?', [id])
    return OK(res, {}, '已删除')
  } catch (e) {
    console.error('[admin.deletePost]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 举报列表 */
r.get('/admin/reports', async (req, res) => {
  try {
    const status = ['pending', 'resolved', 'ignored'].includes(String(req.query.status))
      ? String(req.query.status)
      : 'pending'
    const rows = await q(
      `SELECT r.*, ru.username AS reporter_name, p.title AS post_title,
              (SELECT username FROM users WHERE id=(SELECT user_id FROM posts WHERE id=r.post_id)) AS post_author,
              (SELECT content FROM replies WHERE id=r.target_id) AS comment_content,
              (SELECT username FROM users WHERE id=r.target_id) AS target_user,
              (SELECT username FROM users WHERE id=(SELECT user_id FROM replies WHERE id=r.target_id)) AS comment_author
         FROM reports r
         LEFT JOIN users ru ON ru.id=r.reporter_id
         LEFT JOIN posts p ON p.id=r.post_id
        WHERE r.status = ?
        ORDER BY r.id DESC LIMIT 200`,
      [status],
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[admin.reports]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 处理举报：resolve 仅标记；ignore 忽略；action 可带 deleteTarget / banUser */
r.post('/admin/reports/:id/resolve', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const action = ['resolve', 'ignore'].includes(req.body?.action) ? req.body.action : 'resolve'
    const target = await one('SELECT * FROM reports WHERE id=?', [id])
    if (!target) return FAIL(res, '举报不存在', 404)

    if (req.body?.deleteTarget) {
      if (target.target_type === 'post') {
        await q('DELETE FROM replies WHERE post_id=?', [target.target_id])
        await q('DELETE FROM post_tags WHERE post_id=?', [target.target_id])
        await q('DELETE FROM post_likes WHERE post_id=?', [target.target_id])
        await q('DELETE FROM share_logs WHERE post_id=?', [target.target_id])
        await q('DELETE FROM bookmarks WHERE post_id=?', [target.target_id])
        await q('DELETE FROM posts WHERE id=?', [target.target_id])
      } else {
        await q('DELETE FROM replies WHERE id=?', [target.target_id])
      }
    }

    if (req.body?.banUser) {
      let uid = null
      if (target.target_type === 'post') {
        const p = await one('SELECT user_id FROM posts WHERE id=?', [target.target_id])
        uid = p?.user_id
      } else {
        const c = await one('SELECT user_id FROM replies WHERE id=?', [target.target_id])
        uid = c?.user_id
      }
      if (uid && uid !== req.admin.id) await q('UPDATE users SET status=0 WHERE id=?', [uid])
    }

    await q('UPDATE reports SET status=? WHERE id=?', [action === 'ignore' ? 'ignored' : 'resolved', id])
    return OK(res, {}, action === 'ignore' ? '已忽略' : '已处理')
  } catch (e) {
    console.error('[admin.resolve]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 账号列表 */
r.get('/admin/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20))
    const keyword = String(req.query.q || '').trim().slice(0, 50)
    const whereSql = keyword ? 'WHERE (u.username LIKE ? OR u.email LIKE ?)' : ''
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
    const rows = await q(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.points, u.created_at,
              (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id) AS post_count
         FROM users u ${whereSql} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
      [...params, size, (page - 1) * size],
    )
    const total = await one(`SELECT COUNT(*) AS c FROM users u ${whereSql}`, params)
    return OK(res, { items: rows, total: Number(total?.c || 0), page, size })
  } catch (e) {
    console.error('[admin.users]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.patch('/admin/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return FAIL(res, '参数错误')
    if (id === req.admin.id) return FAIL(res, '不能改自己的权限或状态')
    const body = req.body || {}
    if ('status' in body) {
      const st = Number(body.status)
      if (![0, 1].includes(st)) return FAIL(res, '状态不合法')
      await q('UPDATE users SET status=? WHERE id=?', [st, id])
    }
    if ('role' in body) {
      const role = String(body.role)
      if (!['user', 'admin'].includes(role)) return FAIL(res, '角色不合法')
      await q('UPDATE users SET role=? WHERE id=?', [role, id])
    }
    return OK(res, {}, '已更新')
  } catch (e) {
    console.error('[admin.patchUser]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 趋势：注册 / 发帖 / 回复，按天 */
r.get('/admin/trends', async (req, res) => {
  try {
    const days = Math.min(30, Math.max(7, Number(req.query.days) || 14))
    const rows = await q(
      `WITH RECURSIVE days AS (
         SELECT CURDATE() - INTERVAL ? DAY AS d
         UNION ALL SELECT d + INTERVAL 1 DAY FROM days WHERE d < CURDATE()
       )
       SELECT DATE_FORMAT(d, '%Y-%m-%d') AS day,
         (SELECT COUNT(*) FROM users u WHERE DATE(u.created_at)=d) AS users,
         (SELECT COUNT(*) FROM posts p WHERE DATE(p.created_at)=d) AS posts,
         (SELECT COUNT(*) FROM replies r WHERE DATE(r.created_at)=d) AS replies
       FROM days`,
      [days - 1],
    )
    return OK(res, { days, items: rows })
  } catch (e) {
    console.error('[admin.trends]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 轮播图管理 */
r.get('/admin/banners', async (_req, res) => {
  try {
    const rows = await q('SELECT * FROM banners ORDER BY sort ASC, id DESC')
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[admin.banners]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/admin/banners', async (req, res) => {
  try {
    const image = String(req.body?.image || '').trim()
    const link = String(req.body?.link || '').trim().slice(0, 255)
    const title = String(req.body?.title || '').trim().slice(0, 100)
    const sort = Number(req.body?.sort) || 0
    const enabled = req.body?.enabled === false ? 0 : 1
    if (!image) return FAIL(res, '先上传一张图')
    if (link && !/^https?:\/\//i.test(link)) return FAIL(res, '跳转地址要以 http:// 或 https:// 开头')
    const ins = await q('INSERT INTO banners (image, link, title, sort, enabled) VALUES (?,?,?,?,?)', [
      image, link, title, sort, enabled,
    ])
    return OK(res, { id: ins.insertId }, '已添加')
  } catch (e) {
    console.error('[admin.createBanner]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.patch('/admin/banners/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const image = String(req.body?.image || '').trim()
    const link = String(req.body?.link || '').trim().slice(0, 255)
    const title = String(req.body?.title || '').trim().slice(0, 100)
    const sort = Number(req.body?.sort) || 0
    const enabled = req.body?.enabled === false ? 0 : 1
    if (!image) return FAIL(res, '图片不能为空')
    if (link && !/^https?:\/\//i.test(link)) return FAIL(res, '跳转地址要以 http:// 或 https:// 开头')
    await q('UPDATE banners SET image=?, link=?, title=?, sort=?, enabled=? WHERE id=?', [
      image, link, title, sort, enabled, id,
    ])
    return OK(res, {}, '已保存')
  } catch (e) {
    console.error('[admin.patchBanner]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.delete('/admin/banners/:id', async (req, res) => {
  try {
    await q('DELETE FROM banners WHERE id=?', [Number(req.params.id)])
    return OK(res, {}, '已删除')
  } catch (e) {
    console.error('[admin.deleteBanner]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 公告管理 */
r.get('/admin/notices', async (_req, res) => {
  try {
    const rows = await q('SELECT * FROM notices ORDER BY id DESC LIMIT 100')
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[admin.notices]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/admin/notices', async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim()
    const content = String(req.body?.content || '').trim()
    if (title.length < 2 || title.length > 120) return FAIL(res, '标题需 2-120 字')
    if (!content) return FAIL(res, '内容不能为空')
    const ins = await q('INSERT INTO notices (title, content, author_id) VALUES (?,?,?)', [
      title,
      content,
      req.admin.id,
    ])
    return OK(res, { id: ins.insertId }, '已发布')
  } catch (e) {
    console.error('[admin.createNotice]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.patch('/admin/notices/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const title = String(req.body?.title || '').trim()
    const content = String(req.body?.content || '').trim()
    if (!id) return FAIL(res, '参数错误')
    if (title.length < 2 || title.length > 120) return FAIL(res, '标题需 2-120 字')
    if (!content) return FAIL(res, '内容不能为空')
    await q('UPDATE notices SET title=?, content=? WHERE id=?', [title, content, id])
    return OK(res, {}, '已保存')
  } catch (e) {
    console.error('[admin.patchNotice]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.delete('/admin/notices/:id', async (req, res) => {
  try {
    await q('DELETE FROM notices WHERE id=?', [Number(req.params.id)])
    return OK(res, {}, '已删除')
  } catch (e) {
    console.error('[admin.deleteNotice]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 板块管理 */
r.get('/admin/categories', async (_req, res) => {
  try {
    const rows = await q(
      `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id) AS post_count
         FROM categories c ORDER BY c.sort ASC, c.id ASC`,
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[admin.categories]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.post('/admin/categories', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const slug = String(req.body?.slug || '').trim().toLowerCase()
    const desc = String(req.body?.description || '').trim().slice(0, 200)
    const sort = Number(req.body?.sort) || 0
    if (name.length < 1 || name.length > 20) return FAIL(res, '名字需 1-20 字')
    if (!/^[a-z0-9-]{2,30}$/.test(slug)) return FAIL(res, '英文标识只能是小写字母、数字、横线')
    const dup = await one('SELECT id FROM categories WHERE slug=?', [slug])
    if (dup) return FAIL(res, '这个标识已被占用')
    const ins = await q('INSERT INTO categories (name, slug, description, sort) VALUES (?,?,?,?)', [
      name,
      slug,
      desc,
      sort,
    ])
    return OK(res, { id: ins.insertId }, '已创建')
  } catch (e) {
    console.error('[admin.createCategory]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.patch('/admin/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const name = String(req.body?.name || '').trim()
    const desc = String(req.body?.description || '').trim().slice(0, 200)
    const sort = Number(req.body?.sort) || 0
    if (!id) return FAIL(res, '参数错误')
    if (name.length < 1 || name.length > 20) return FAIL(res, '名字需 1-20 字')
    await q('UPDATE categories SET name=?, description=?, sort=? WHERE id=?', [name, desc, sort, id])
    return OK(res, {}, '已保存')
  } catch (e) {
    console.error('[admin.patchCategory]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

r.delete('/admin/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const c = await one('SELECT COUNT(*) AS c FROM posts WHERE category_id=?', [id])
    if (Number(c?.c) > 0) return FAIL(res, '这个板块下还有帖子，不能删')
    await q('DELETE FROM tags WHERE category_id=?', [id])
    await q('DELETE FROM categories WHERE id=?', [id])
    return OK(res, {}, '已删除')
  } catch (e) {
    console.error('[admin.deleteCategory]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

export default r
