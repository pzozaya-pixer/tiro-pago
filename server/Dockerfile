FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile --filter tiro22-api...
COPY server/prisma ./server/prisma
WORKDIR /app/server
RUN pnpm prisma:generate

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
WORKDIR /app/server
RUN pnpm build

FROM node:22-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY server/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
