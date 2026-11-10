import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex')
const COOKIE = 'jy_session'
const TTL = 7 * 86400

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function signSession(payload) {
  const exp = Math.floor(Date.now() / 1000) + TTL
  const body = b64url(JSON.stringify({ ...payload, exp }))
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token) {
  if (!token) return null
  const parts = String(token).split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expect = createHmac('sha256', SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const out = {}
  const raw = req.headers?.cookie || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function sessionUser(req) {
  return verifySession(parseCookies(req)[COOKIE])
}

export function setSessionCookie(res, token) {
  res.append(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}`,
  )
}

export function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}
