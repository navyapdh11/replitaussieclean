FROM node:22-alpine AS base

ENV NODE_ENV=production

FROM base AS deps

WORKDIR /app

COPY artifacts/booking-app/package.json /app/package.json

RUN npm install --legacy-peer-deps

FROM base AS builder

WORKDIR /app

COPY artifacts/booking-app/package.json /app/
RUN npm install --legacy-peer-deps

COPY artifacts/booking-app/ /app/

RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY artifacts/booking-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]