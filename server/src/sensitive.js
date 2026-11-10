import { q } from './db.js'

let cache = { at: 0, words: [] }
const TTL = 60_000

async function load() {
  if (Date.now() - cache.at < TTL) return cache.words
  const rows = await q('SELECT word FROM sensitive_words')
  cache = { at: Date.now(), words: rows.map((r) => r.word.toLowerCase()) }
  return cache.words
}

export function invalidateSensitive() {
  cache.at = 0
}

/** 返回命中的词，没有返回 null */
export async function hitSensitive(text) {
  const t = String(text || '').toLowerCase()
  if (!t) return null
  const words = await load()
  for (const w of words) if (w && t.includes(w)) return w
  return null
}
