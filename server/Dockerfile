# syntax=docker/dockerfile:1
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

ENV HOST=0.0.0.0 \
    PORT=3000 \
    UPLOAD_DIR=/data/uploads/media
RUN mkdir -p /data/uploads

EXPOSE 3000
CMD ["node", "index.js"]
