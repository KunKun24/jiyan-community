# 极验社区

一个干净、专注内容的开源社区系统。没有推荐算法，没有无限滚动，只有板块、帖子、回复。

## 技术栈

| 层 | 选择 |
|---|---|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8 + Redis |

## 目录结构

```
.
├── web/          # 前端（Vue 3 + Vite）
│   ├── src/      # 源码
│   └── dist/     # 构建产物（不提交）
└── server/       # 后端（Express API）
    ├── index.js  # 入口
    └── .env      # 环境变量（不提交）
```

## 本地开发

**后端**

```bash
cd server
cp .env.example .env   # 填写数据库与 Redis 配置
npm install
npm run dev
```

**前端**

```bash
cd web
npm install
npm run dev            # http://127.0.0.1:5173
```

## 构建

```bash
cd web
npm run build          # 产物输出到 web/dist
```

## 部署

Nginx 静态托管 `web/dist`，`/api/` 反向代理到 `127.0.0.1:3000`，后端由 PM2 托管。

## Docker 部署

```bash
cp .env.docker.example .env    # 改密码、SESSION_SECRET、SMTP
docker compose up -d --build
```

浏览器打开 `http://服务器IP:8080`。

- 四个服务：`web`（nginx + 前端静态文件）、`server`（Express + WebSocket）、`mysql`、`redis`
- MySQL 首次启动会按顺序导入 `server/sql/*.sql`
- 上传的图片/视频在 `uploads` 数据卷，`server` 与 `web` 共享
- 多架构镜像（`linux/amd64`、`linux/arm64`）：`ghcr.io/kunkun24/jiyan-community-web`、`ghcr.io/kunkun24/jiyan-community-server`


## 许可证

[MIT](./LICENSE)

---

## 关于 AIGC

> 项目包含 AIGC 内容，AI 减少了开发时间；我们也认真审核了每一条代码。
