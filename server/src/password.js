import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const KEYLEN = 64

export function hashPassword(password) {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEYLEN, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(password, stored) {
  try {
    const [algo, n, r, p, saltB64, keyB64] = String(stored).split('$')
    if (algo !== 'scrypt') return false
    const salt = Buffer.from(saltB64, 'base64')
    const expect = Buffer.from(keyB64, 'base64')
    const actual = scryptSync(password, salt, expect.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
    return actual.length === expect.length && timingSafeEqual(actual, expect)
  } catch {
    return false
  }
}
