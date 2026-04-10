FROM node:22-alpine AS base

RUN apk add --no-cache openssl

ENV NODE_ENV=production

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=corepack /usr/local/bin/pnpm /usr/local/bin/pnpm

RUN pnpm install --frozen-lockfile --prod

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=corepack /usr/local/bin/pnpm /usr/local/bin/pnpm

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @workspace/api-server build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/artifacts/api-server/dist /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app

USER nodejs

EXPOSE 3000

CMD ["node", "index.mjs"]