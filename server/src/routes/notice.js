import { Router } from 'express'
import { q, one } from '../db.js'

const r = Router()

const OK = (res, data = {}) => res.json({ ok: true, msg: 'ok', data })
const FAIL = (res, msg, code = 400) => res.status(code).json({ ok: false, msg })

/** 公告列表 */
r.get('/notices', async (_req, res) => {
  try {
    const rows = await q(
      'SELECT id, title, content, created_at FROM notices ORDER BY created_at DESC LIMIT 50',
    )
    return OK(res, { notices: rows })
  } catch (e) {
    console.error('[notice.list]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

/** 单条公告 */
r.get('/notices/:id', async (req, res) => {
  try {
    const n = await one('SELECT id, title, content, created_at FROM notices WHERE id=?', [
      Number(req.params.id) || 0,
    ])
    if (!n) return FAIL(res, '公告不存在', 404)
    return OK(res, { notice: n })
  } catch (e) {
    console.error('[notice.detail]', e)
    return FAIL(res, '服务器错误', 500)
  }
})

export default r
