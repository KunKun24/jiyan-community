import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { sessionUser } from '../session.js'

const r = Router()
const dir = '/www/wwwroot/极验社区/web/uploads/media'
fs.mkdirSync(dir, { recursive: true })

const storage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase()
    cb(null, `m${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const imageUp = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)),
})
const videoUp = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^video\/(mp4|webm|quicktime)$/.test(file.mimetype)),
})

function auth(req, res, next) {
  const s = sessionUser(req)
  if (!s?.uid) return res.status(401).json({ ok: false, msg: '请先登录' })
  req.uid = s.uid
  next()
}

r.post('/image', auth, imageUp.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: '只支持 jpg / png / webp / gif，且不超过 10MB' })
  res.json({ ok: true, msg: 'ok', data: { url: `/uploads/media/${req.file.filename}` } })
})

r.post('/video', auth, videoUp.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: '只支持 mp4 / webm / mov，且不超过 100MB' })
  res.json({ ok: true, msg: 'ok', data: { url: `/uploads/media/${req.file.filename}` } })
})

export default r
