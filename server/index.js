import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { verifySession, parseCookies } from './src/session.js';
import { addConn, removeConn, onlineCount } from './src/rt.js';
import authRouter from './src/routes/auth.js'
import uploadRouter from './src/routes/upload.js';
import forumRouter from './src/routes/forum.js';
import userRouter from './src/routes/user.js';
import socialRouter from './src/routes/social.js'
import adminRouter from './src/routes/admin.js'
import noticeRouter from './src/routes/notice.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'shequ-server', ts: Date.now() });
});

app.use('/api/auth', authRouter)
app.use('/api/upload', uploadRouter);
app.use('/api', forumRouter);
app.use('/api/user', userRouter);
app.use('/api', noticeRouter);
app.use('/api', socialRouter);
app.use('/api', adminRouter);

/* 分享预览卡片：直接返回注入 og meta 的 index.html */
app.get('/post/:id', async (req, res) => {
  try {
    const { postHtml } = await import('./src/og.js')
    const html = await postHtml(Number(req.params.id))
    if (!html) return res.status(404).send('Not Found')
    res.type('html').send(html)
  } catch (e) {
    console.error('[og.post]', e)
    res.status(500).send('error')
  }
})

app.get('/u/:id', async (req, res) => {
  try {
    const { userHtml } = await import('./src/og.js')
    const html = await userHtml(Number(req.params.id))
    if (!html) return res.status(404).send('Not Found')
    res.type('html').send(html)
  } catch (e) {
    console.error('[og.user]', e)
    res.status(500).send('error')
  }
});

app.use((req, res) => {
  res.status(404).json({ ok: false, msg: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ ok: false, msg: '服务器错误' });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const token = parseCookies(req).jy_session;
  const session = verifySession(token);
  if (!session?.uid) {
    ws.close(4001, 'unauthorized');
    return;
  }
  const uid = session.uid;
  addConn(uid, ws);
  ws.send(JSON.stringify({ type: 'online', count: onlineCount() }));
  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(String(raw)) } catch { return }
    if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
  });
  ws.on('close', () => {
    removeConn(uid, ws)
  });
  ws.on('error', () => removeConn(uid, ws));
});

server.listen(port, host, () => {
  console.log(`[shequ] server listening on http://${host}:${port} (ws /ws)`);
});
