# Built from the repo root (Railway: RAILWAY_DOCKERFILE_PATH=apps/Dockerfile)
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY apps/package.json apps/package-lock.json ./
RUN npm ci --omit=dev
COPY apps/src ./src
COPY apps/public ./public
USER node
CMD ["node", "src/server.js"]
