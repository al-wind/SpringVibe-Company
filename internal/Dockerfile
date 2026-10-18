# Built from the repo root (Railway: RAILWAY_DOCKERFILE_PATH=internal/Dockerfile)
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY internal/package.json internal/package-lock.json ./
RUN npm ci --omit=dev
COPY internal/src ./src
COPY internal/public ./public
USER node
CMD ["node", "src/server.js"]
