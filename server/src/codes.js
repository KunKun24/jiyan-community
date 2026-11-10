import { createHash } from 'node:crypto'
import { one, q } from './db.js'
import { genCode } from './code.js'
import { sendMail } from './mailer.js'
import { codeMail } from './mail-template.js'

const TTL = Number(process.env.CODE_TTL || 300)
const GAP = Number(process.env.CODE_GAP || 60)
const PER_HOUR = Number(process.env.CODE_PER_HOUR || 6)
const MAX_ATTEMPTS = Number(process.env.CODE_MAX_ATTEMPTS || 6)

export const codeTtlMinutes = () => Math.max(1, Math.round(TTL / 60))

function hashCode(code, email, purpose) {
  return createHash('sha256').update(`${code}|${email}|${purpose}`).digest('hex')
}

/**
 * 生成并发送验证码
 * @returns {Promise<[boolean, string]>}
 */
export async function issueCode(email, purpose = 'register', ip = '') {
  const last = await one(
    'SELECT created_at, (TIMESTAMPDIFF(SECOND, created_at, NOW())) AS age FROM email_codes WHERE email=? AND purpose=? ORDER BY id DESC LIMIT 1',
    [email, purpose],
  )
  if (last && Number(last.age) < GAP) {
    return [false, `请求过于频繁，请 ${GAP - Number(last.age)} 秒后再试`]
  }

  const cnt = await one(
    'SELECT COUNT(*) AS c FROM email_codes WHERE email=? AND created_at > (NOW() - INTERVAL 1 HOUR)',
    [email],
  )
  if (Number(cnt.c) >= PER_HOUR) {
    return [false, '该邮箱验证码请求次数过多，请稍后再试']
  }

  const code = genCode()
  await q(
    'INSERT INTO email_codes (email, purpose, code_hash, ip, expires_at, created_at) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND),NOW())',
    [email, purpose, hashCode(code, email, purpose), ip || null, TTL],
  )

  const mail = codeMail({ code, minutes: codeTtlMinutes(), purpose })
  const [ok, msg] = await sendMail({ to: email, ...mail })
  if (!ok) return [false, `邮件发送失败：${msg}`]
  return [true, '验证码已发送']
}

/**
 * 校验并消费验证码
 * @returns {Promise<[boolean, string]>}
 */
export async function consumeCode(email, purpose, code) {
  const row = await one(
    'SELECT *, (expires_at < NOW()) AS expired FROM email_codes WHERE email=? AND purpose=? AND used=0 ORDER BY id DESC LIMIT 1',
    [email, purpose],
  )
  if (!row) return [false, '请先获取验证码']
  if (Number(row.expired)) return [false, '验证码已过期，请重新获取']
  if (Number(row.attempts) >= MAX_ATTEMPTS) return [false, '尝试次数过多，请重新获取验证码']

  await q('UPDATE email_codes SET attempts=attempts+1 WHERE id=?', [row.id])
  if (row.code_hash !== hashCode(code, email, purpose)) return [false, '验证码不正确']

  await q('UPDATE email_codes SET used=1 WHERE id=?', [row.id])
  return [true, 'ok']
}
