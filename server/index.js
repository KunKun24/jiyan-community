import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './src/routes/auth.js'
import uploadRouter from './src/routes/upload.js';
import forumRouter from './src/routes/forum.js';
import userRouter from './src/routes/user.js';
import socialRouter from './src/routes/social.js'
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

app.use((req, res) => {
  res.status(404).json({ ok: false, msg: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ ok: false, msg: '服务器错误' });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

app.listen(port, host, () => {
  console.log(`[shequ] server listening on http://${host}:${port}`);
});
