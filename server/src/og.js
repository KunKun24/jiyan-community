import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { one } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../../web/dist/index.html')
const BASE = process.env.SITE_BASE_URL || 'http://shequ.xn--0try77c6um82w.cn'

let cache = { at: 0, html: '' }
function template() {
  if (Date.now() - cache.at < 30_000 && cache.html) return cache.html
  try {
    cache = { at: Date.now(), html: fs.readFileSync(DIST, 'utf8') }
  } catch {
    cache.html = '<!doctype html><html><head><title>极验社区</title></head><body></body></html>'
  }
  return cache.html
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plain(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function renderMeta({ title, description, image }) {
  const t = `${title} · 极验社区`
  const abs = image ? (image.startsWith('http') ? image : BASE + image) : `${BASE}/logo.png`
  const metas = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="极验社区" />
    <meta property="og:title" content="${esc(t)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(abs)}" />
    <meta property="og:url" content="${esc(BASE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(t)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(abs)}" />
    <meta name="description" content="${esc(description)}" />`
  let html = template()
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(t)}</title>`)
  html = html.replace('</head>', `${metas}\n</head>`)
  return html
}

export async function postHtml(id) {
  const p = await one(
    `SELECT p.id, p.title, p.content, p.content_html, p.user_id, p.status,
            (SELECT COUNT(*) FROM posts WHERE 1=0) AS _x
       FROM posts p WHERE p.id=?`,
    [id],
  )
  if (!p) return null
  const firstImg = (String(p.content_html || '').match(/<img[^>]+src="([^"]+)"/) || [])[1] || null
  const desc = plain(p.content_html || p.content).slice(0, 110)
  return renderMeta({ title: p.title, description: desc || '极验社区的一篇帖子。', image: firstImg })
}

export async function userHtml(id) {
  const u = await one('SELECT id, username, bio, avatar FROM users WHERE id=?', [id])
  if (!u) return null
  return renderMeta({
    title: `${u.username} 的主页`,
    description: (u.bio || `${u.username} 在极验社区的主页。`).slice(0, 110),
    image: u.avatar || null,
  })
}
