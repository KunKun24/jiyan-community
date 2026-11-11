import { Router } from 'express'
import { one, q } from '../db.js'
import { hashPassword, verifyPassword } from '../password.js'
import { issueCode, consumeCode } from '../codes.js'
import { sendMail } from '../mailer.js'
import { resetMail } from '../mail-template.js'
import { signSession, sessionUser, setSessionCookie, clearSessionCookie } from '../session.js'
import { clientIp, rateLimit } from '../ratelimit.js'

const r = Router()

const OK = (res, data = {}, msg = 'ok') => res.json({ ok: true, msg, data })
const FAIL = (res, msg, code = 400) => res.status(code).json({ ok: false, msg })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 用户名：中英文、数字、下划线、连字符，2-32 位
const USERNAME_RE = /^[\p{L}\p{N}_-]{2,32}$/u

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    createdAt: u.created_at,
  }
}

/** 发送验证码：register | reset */
r.post('/send-code', async (req, res) => {
  try {
    const rl = await rateLimit(`rl:code:${clientIp(req)}`, 10, 3600)
    if (!rl.ok) return FAIL(res, '发得太频繁了，歇一小时再试', 429)
    const email = String(req.body?.email || '').trim().toLowerCase()
    const purpose = String(req.body?.purpose || 'register')
    if (!EMAIL_RE.test(email)) return FAIL(res, '邮箱格式不正确')
    if (!['register', 'reset'].includes(purpose)) return FAIL(res, '参数不正确')

    if (purpose === 'register') {
      const exists = await one('SELECT id FROM users WHERE email=?', [email])
      if (exists) return FAIL(res, '该邮箱已被注册')
    }

    const [ok, msg] = await issueCode(email, purpose, clientIp(req))
    return ok ? OK(res, { ttl: 300 }, msg) : FAIL(res, msg)
  } catch (e) {
    console.error('[auth.send-code]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 注册 */
r.post('/register', async (req, res) => {
  try {
    const rl = await rateLimit(`rl:reg:${clientIp(req)}`, 5, 3600)
    if (!rl.ok) return FAIL(res, '今天注册得有点多，歇一小时再试', 429)
    const username = String(req.body?.username || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const password2 = String(req.body?.password2 || '')
    const code = String(req.body?.code || '').trim()

    if (!USERNAME_RE.test(username)) return FAIL(res, '用户名需 2-32 位，支持中英文、数字、下划线和连字符')
    if (!EMAIL_RE.test(email)) return FAIL(res, '邮箱格式不正确')
    if (password.length < 6) return FAIL(res, '密码至少 6 位')
    if (password !== password2) return FAIL(res, '两次输入的密码不一致')
    if (!/^[A-Za-z0-9]{8}$/.test(code)) return FAIL(res, '请输入 8 位验证码')

    if (await one('SELECT id FROM users WHERE username=?', [username])) return FAIL(res, '用户名已被占用')
    if (await one('SELECT id FROM users WHERE email=?', [email])) return FAIL(res, '该邮箱已被注册')

    const [ok, msg] = await consumeCode(email, 'register', code)
    if (!ok) return FAIL(res, msg)

    // 邀请码（可选，一人一码、永久有效、可无限邀请）
    let invitedBy = null
    const invite = String(req.body?.invite || '').trim().toUpperCase()
    if (invite) {
      const inviter = await one('SELECT id FROM users WHERE invite_code=?', [invite])
      if (!inviter) return FAIL(res, '邀请码不存在')
      invitedBy = inviter.id
    }

    const result = await q('INSERT INTO users (username, email, password_hash, invited_by) VALUES (?,?,?,?)', [
      username,
      email,
      hashPassword(password),
      invitedBy,
    ])
    const user = await one('SELECT * FROM users WHERE id=?', [result.insertId])
    if (!user.invite_code) {
      let ic = newInviteCode()
      for (let i = 0; i < 5; i++) {
        if (!(await one('SELECT 1 AS x FROM users WHERE invite_code=?', [ic]))) break
        ic = newInviteCode()
      }
      await q('UPDATE users SET invite_code=? WHERE id=?', [ic, user.id])
      user.invite_code = ic
    }
    setSessionCookie(res, signSession({ uid: user.id }))
    return OK(res, { user: publicUser(user) }, '注册成功')
  } catch (e) {
    console.error('[auth.register]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 登录：账号可以是用户名或邮箱 */
r.post('/login', async (req, res) => {
  try {
    const rl = await rateLimit(`rl:login:${clientIp(req)}`, 30, 900)
    if (!rl.ok) return FAIL(res, '尝试太频繁了，等 15 分钟再试', 429)
    const account = String(req.body?.account || '').trim()
    const password = String(req.body?.password || '')
    if (!account || !password) return FAIL(res, '请输入账号和密码')

    const user = await one('SELECT * FROM users WHERE username=? OR email=?', [account, account.toLowerCase()])
    if (!user) return FAIL(res, '账号或密码错误')
    if (Number(user.status) !== 1) return FAIL(res, '账号已被禁用')
    if (!verifyPassword(password, user.password_hash)) return FAIL(res, '账号或密码错误')

    await q('INSERT INTO login_logs (user_id, ip, ua) VALUES (?,?,?)', [
      user.id,
      clientIp(req),
      String(req.headers['user-agent'] || '').slice(0, 255),
    ])
    setSessionCookie(res, signSession({ uid: user.id }))
    return OK(res, { user: publicUser(user) }, '登录成功')
  } catch (e) {
    console.error('[auth.login]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/**
 * 找回密码：用户名 + 邮箱匹配 → 重置为固定密码并邮件通知
 * 不提供"找回原密码"，只能重置。
 */
r.post('/reset-password', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!username || !EMAIL_RE.test(email)) return FAIL(res, '请填写用户名和邮箱')

    const user = await one('SELECT * FROM users WHERE username=? AND email=?', [username, email])
    if (!user) return FAIL(res, '用户名与邮箱不匹配')

    const plain = process.env.RESET_PASSWORD || '12345678'
    await q('UPDATE users SET password_hash=? WHERE id=?', [hashPassword(plain), user.id])

    const mail = resetMail({ username: user.username, password: plain })
    const [ok, msg] = await sendMail({ to: user.email, ...mail })
    if (!ok) return FAIL(res, `密码已重置，但邮件发送失败：${msg}`, 500)

    return OK(res, {}, '密码已重置，新密码已发送到你的邮箱')
  } catch (e) {
    console.error('[auth.reset-password]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 当前登录用户 */
r.get('/me', async (req, res) => {
  try {
    const s = sessionUser(req)
    if (!s?.uid) return FAIL(res, '未登录', 401)
    const user = await one('SELECT * FROM users WHERE id=?', [s.uid])
    if (!user || Number(user.status) !== 1) return FAIL(res, '未登录', 401)
    return OK(res, { user: publicUser(user) })
  } catch (e) {
    console.error('[auth.me]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 退出登录 */
r.post('/logout', (req, res) => {
  clearSessionCookie(res)
  return OK(res, {}, '已退出')
})

export default r
