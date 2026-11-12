# syntax=docker/dockerfile:1
# 前端产物是纯静态文件，构建阶段固定跑在构建机架构上（amd64），
# 避免 arm64 下用 QEMU 跑 npm/vite 慢到不可用
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
