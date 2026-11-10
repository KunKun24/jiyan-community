import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import { one, q } from '../db.js'
import { sessionUser } from '../session.js'
import { hashPassword, verifyPassword } from '../password.js'
import { levelOf, growthOf } from '../level.js'

const r = Router()

const OK = (res, data = {}, msg = 'ok') => res.json({ ok: true, msg, data })
const FAIL = (res, msg, code = 400) => res.status(code).json({ ok: false, msg })

const AVATAR_DIR = '/www/wwwroot/极验社区/web/uploads/avatars'
fs.mkdirSync(AVATAR_DIR, { recursive: true })

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function auth(req, res, next) {
  const s = sessionUser(req)
  if (!s?.uid) return FAIL(res, '请先登录', 401)
  req.uid = s.uid
  next()
}

const USERNAME_RE = /^[\p{L}\p{N}_-]{2,32}$/u

function profileOf(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    bio: u.bio,
    location: u.location,
    website: u.website,
    contact: u.contact,
    role: u.role,
    createdAt: u.created_at,
    points: Number(u.points || 0),
    checkinCount: Number(u.checkin_count || 0),
    likesReceived: Number(u.likes_received || 0),
    shareCount: Number(u.share_count || 0),
    lastCheckinOn: u.last_checkin_on || null,
  }
}

/** 我的资料 */
r.get('/profile', auth, async (req, res) => {
  try {
    const u = await one('SELECT * FROM users WHERE id=?', [req.uid])
    if (!u) return FAIL(res, '用户不存在', 404)
    const stats = await one(
      `SELECT (SELECT COUNT(*) FROM posts WHERE user_id=?) AS pc,
              (SELECT COUNT(*) FROM replies WHERE user_id=?) AS rc`,
      [req.uid, req.uid],
    )
    return OK(res, {
      user: profileOf(u),
      level: levelOf(growthOf(u)),
      stats: { posts: Number(stats.pc), replies: Number(stats.rc) },
    })
  } catch (e) {
    console.error('[user.profile]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 每日签到 */
r.post('/checkin', auth, async (req, res) => {
  try {
    const r2 = await q(
      `UPDATE users
          SET checkin_count = checkin_count + 1,
              points = points + 3,
              last_checkin_on = CURDATE()
        WHERE id = ? AND (last_checkin_on IS NULL OR last_checkin_on < CURDATE())`,
      [req.uid],
    )
    if (!r2.affectedRows) return FAIL(res, '今天已经签过了，明天再来。')

    const u = await one('SELECT * FROM users WHERE id=?', [req.uid])
    return OK(
      res,
      { user: profileOf(u), level: levelOf(growthOf(u)), gained: 3 },
      '签到成功，贡献值 +3',
    )
  } catch (e) {
    console.error('[user.checkin]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 我的帖子（含私密） */
r.get('/posts', auth, async (req, res) => {
  try {
    const rows = await q(
      `SELECT p.id, p.title, p.status, p.views, p.like_count, p.reply_count, p.created_at,
              c.name AS category_name, c.slug AS category_slug
         FROM posts p JOIN categories c ON c.id = p.category_id
        WHERE p.user_id = ?
        ORDER BY p.id DESC LIMIT 200`,
      [req.uid],
    )
    return OK(res, {
      posts: rows.map((x) => ({
        id: x.id,
        title: x.title,
        status: x.status,
        views: Number(x.views),
        likeCount: Number(x.like_count),
        replyCount: Number(x.reply_count),
        createdAt: x.created_at,
        category: { name: x.category_name, slug: x.category_slug },
      })),
    })
  } catch (e) {
    console.error('[user.posts]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 我的收藏 */
r.get('/bookmarks', auth, async (req, res) => {
  try {
    const rows = await q(
      `SELECT b.post_id, b.created_at AS saved_at,
              p.id AS pid, p.title, p.status, p.views,
              c.name AS category_name, u.username
         FROM bookmarks b
         LEFT JOIN posts p ON p.id = b.post_id
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN users u ON u.id = p.user_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC LIMIT 200`,
      [req.uid],
    )
    return OK(res, {
      bookmarks: rows.map((x) => ({
        postId: x.post_id,
        savedAt: x.saved_at,
        available: !!x.pid && x.status === 'public',
        title: x.title || null,
        views: x.views ? Number(x.views) : 0,
        category: x.category_name ? { name: x.category_name } : null,
        author: x.username || null,
      })),
    })
  } catch (e) {
    console.error('[user.bookmarks]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 修改资料：用户名 / 简介 / 所在地 / 网站 / 联系方式 */
r.patch('/profile', auth, async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim()
    const bio = String(req.body?.bio ?? '').trim()
    const location = String(req.body?.location ?? '').trim()
    const website = String(req.body?.website ?? '').trim()
    const contact = String(req.body?.contact ?? '').trim()

    if (!USERNAME_RE.test(username)) return FAIL(res, '用户名需 2-32 位，支持中英文、数字、下划线和连字符')
    if (bio.length > 300) return FAIL(res, '个人简介最多 300 字')
    if (location.length > 64) return FAIL(res, '所在地最多 64 字')
    if (website && !/^https?:\/\/[^\s]+$/i.test(website)) return FAIL(res, '个人网站需以 http:// 或 https:// 开头')
    if (website.length > 200) return FAIL(res, '个人网站地址过长')
    if (contact.length > 120) return FAIL(res, '联系方式最多 120 字')

    const exists = await one('SELECT id FROM users WHERE username=? AND id<>?', [username, req.uid])
    if (exists) return FAIL(res, '这个用户名已经被别人用了')

    await q('UPDATE users SET username=?, bio=?, location=?, website=?, contact=? WHERE id=?', [
      username,
      bio || null,
      location || null,
      website || null,
      contact || null,
      req.uid,
    ])
    const u = await one('SELECT * FROM users WHERE id=?', [req.uid])
    return OK(res, { user: profileOf(u) }, '资料已更新')
  } catch (e) {
    console.error('[user.updateProfile]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 修改密码：需要原密码 */
r.post('/password', auth, async (req, res) => {
  try {
    const oldPassword = String(req.body?.oldPassword ?? '')
    const newPassword = String(req.body?.newPassword ?? '')
    const confirmPassword = String(req.body?.confirmPassword ?? '')

    const u = await one('SELECT password_hash FROM users WHERE id=?', [req.uid])
    if (!u) return FAIL(res, '用户不存在', 404)
    if (!verifyPassword(oldPassword, u.password_hash)) return FAIL(res, '原密码不正确')
    if (newPassword.length < 6) return FAIL(res, '新密码至少 6 位')
    if (newPassword === oldPassword) return FAIL(res, '新密码不能和原密码相同')
    if (newPassword !== confirmPassword) return FAIL(res, '两次输入的新密码不一致')

    await q('UPDATE users SET password_hash=? WHERE id=?', [hashPassword(newPassword), req.uid])
    return OK(res, {}, '密码已修改，下次登录请用新密码')
  } catch (e) {
    console.error('[user.password]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) =>
    cb(null, `u${req.uid}-${Date.now()}${ALLOWED[file.mimetype] || '.jpg'}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, Boolean(ALLOWED[file.mimetype])),
})

/** 上传头像 */
r.post(
  '/avatar',
  auth,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') return FAIL(res, '图片不能超过 2MB')
      return FAIL(res, '上传失败，请换一张 jpg / png / webp / gif 图片')
    })
  },
  async (req, res) => {
    try {
      if (!req.file) return FAIL(res, '请选择图片（jpg / png / webp / gif，2MB 内）')

      const url = `/uploads/avatars/${req.file.filename}`
      const old = await one('SELECT avatar FROM users WHERE id=?', [req.uid])
      await q('UPDATE users SET avatar=? WHERE id=?', [url, req.uid])

      if (old?.avatar?.startsWith('/uploads/avatars/')) {
        try {
          fs.unlinkSync(`/www/wwwroot/极验社区/web${old.avatar}`)
        } catch {
          /* 旧文件不在就忽略 */
        }
      }
      return OK(res, { avatar: url }, '头像已更新')
    } catch (e) {
      console.error('[user.avatar]', e)
      return FAIL(res, '服务器错误', 500)
    }
  },
)

export default r

/* ---------------- 邀请好友 ---------------- */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newInviteCode(len = 8) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

r.get('/invites', auth, async (req, res) => {
  try {
    const uid = req.uid
    let mine = await q('SELECT id, code, used_by, used_at, created_at FROM invites WHERE inviter_id=? ORDER BY id DESC LIMIT 20', [uid])
    if (!mine.length) {
      for (let i = 0; i < 3; i++) {
        let code = newInviteCode()
        for (let k = 0; k < 5; k++) {
          const dup = await one('SELECT 1 AS x FROM invites WHERE code=?', [code])
          if (!dup) break
          code = newInviteCode()
        }
        await q('INSERT INTO invites (code, inviter_id) VALUES (?,?)', [code, uid])
      }
      mine = await q('SELECT id, code, used_by, used_at, created_at FROM invites WHERE inviter_id=? ORDER BY id DESC LIMIT 20', [uid])
    }
    const used = await q('SELECT COUNT(*) AS c FROM invites WHERE inviter_id=? AND used_by IS NOT NULL', [uid])
    return OK(res, {
      baseUrl: process.env.SITE_BASE_URL || 'http://shequ.xn--0try77c6um82w.cn',
      invited: Number(used?.c || 0),
      items: mine.map((i) => ({ id: i.id, code: i.code, used: !!i.used_by, usedAt: i.used_at, createdAt: i.created_at })),
    })
  } catch (e) {
    console.error('[user.invites]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 修改邮箱 ---------------- */

r.post('/email/send-code', auth, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return FAIL(res, '邮箱格式不正确')
    if (email.length > 190) return FAIL(res, '邮箱过长')
    const dup = await one('SELECT id FROM users WHERE email=? AND id<>?', [email, req.uid])
    if (dup) return FAIL(res, '这个邮箱已经被使用了')
    const { issueCode } = await import('../codes.js')
    const { sendMail } = await import('../mailer.js')
    const { codeMail } = await import('../mail-template.js')
    const code = await issueCode(email, 'email', req.ip || '')
    const tpl = codeMail({ code, minutes: 5, purpose: '更换邮箱' })
    await sendMail({ to: email, ...tpl })
    return OK(res, {}, '验证码已发送')
  } catch (e) {
    console.error('[user.emailCode]', e)
    return FAIL(res, e.message?.includes('频繁') ? e.message : '发送失败，请稍后再试', 500)
  }
})

r.post('/email', auth, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const code = String(req.body?.code || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return FAIL(res, '邮箱格式不正确')
    if (!/^[A-Za-z0-9]{8}$/.test(code)) return FAIL(res, '验证码是 8 位字母数字')
    const dup = await one('SELECT id FROM users WHERE email=? AND id<>?', [email, req.uid])
    if (dup) return FAIL(res, '这个邮箱已经被使用了')
    const { consumeCode } = await import('../codes.js')
    const okCode = await consumeCode(email, 'email', code)
    if (!okCode) return FAIL(res, '验证码错误或已过期')
    await q('UPDATE users SET email=?, updated_at=NOW() WHERE id=?', [email, req.uid])
    return OK(res, { email }, '邮箱已更新')
  } catch (e) {
    console.error('[user.email]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 登录记录 ---------------- */

r.get('/logins', auth, async (req, res) => {
  try {
    const rows = await q(
      'SELECT id, ip, ua, created_at FROM login_logs WHERE user_id=? ORDER BY id DESC LIMIT 20',
      [req.uid],
    )
    return OK(res, { items: rows })
  } catch (e) {
    console.error('[user.logins]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/* ---------------- 注销账号 ---------------- */

r.post('/delete', auth, async (req, res) => {
  try {
    const password = String(req.body?.password || '')
    if (!password) return FAIL(res, '请输入密码')
    const u = await one('SELECT id, password_hash FROM users WHERE id=?', [req.uid])
    if (!u) return FAIL(res, '用户不存在', 404)
    const okPwd = await verifyPassword(password, u.password_hash)
    if (!okPwd) return FAIL(res, '密码不正确')
    if (u.id === 1) return FAIL(res, '这个账号不能注销')
    await q('DELETE FROM post_likes WHERE user_id=?', [u.id])
    await q('DELETE FROM bookmarks WHERE user_id=?', [u.id])
    await q('DELETE FROM follows WHERE follower_id=? OR following_id=?', [u.id, u.id])
    await q('DELETE FROM notifications WHERE user_id=? OR actor_id=?', [u.id, u.id])
    await q('DELETE FROM reply_likes WHERE user_id=?', [u.id])
    await q('DELETE FROM messages WHERE sender_id=?', [u.id])
    await q('DELETE FROM conversations WHERE user_a=? OR user_b=?', [u.id, u.id])
    await q('DELETE FROM post_views WHERE viewer=?', [`u:${u.id}`])
    await q('DELETE FROM users WHERE id=?', [u.id])
    const { clearSessionCookie } = await import('../session.js')
    clearSessionCookie(res)
    return OK(res, {}, '账号已注销')
  } catch (e) {
    console.error('[user.delete]', e)
    return FAIL(res, '服务器错误', 500)
  }
})
