FROM node:22-alpine AS build
ARG VITE_DATA_PROVIDER=api
ARG VITE_API_URL=/api
ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_DATA_PROVIDER=$VITE_DATA_PROVIDER
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile --filter tiro22...
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html/tiropago
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
