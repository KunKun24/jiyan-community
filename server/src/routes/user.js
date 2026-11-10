import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import { one, q } from '../db.js'
import { sessionUser } from '../session.js'
import { hashPassword, verifyPassword } from '../password.js'

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
      stats: { posts: Number(stats.pc), replies: Number(stats.rc) },
    })
  } catch (e) {
    console.error('[user.profile]', e)
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
