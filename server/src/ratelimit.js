import Redis from 'ioredis'

let redis = null
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  })
  redis.on('error', () => {})
} catch {
  redis = null
}

const mem = new Map()

/** 计数限速：返回 { ok, left } */
export async function rateLimit(key, limit, windowSec) {
  if (redis) {
    try {
      const n = await redis.incr(key)
      if (n === 1) await redis.expire(key, windowSec)
      return { ok: n <= limit, left: Math.max(0, limit - n) }
    } catch {
      /* 降级到内存 */
    }
  }
  const now = Date.now()
  const rec = mem.get(key)
  if (!rec || rec.exp < now) {
    mem.set(key, { n: 1, exp: now + windowSec * 1000 })
    return { ok: true, left: limit - 1 }
  }
  rec.n += 1
  return { ok: rec.n <= limit, left: Math.max(0, limit - rec.n) }
}

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return fwd || req.socket?.remoteAddress || 'unknown'
}
