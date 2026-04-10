FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_API_BASE
ARG API_PROXY_TARGET

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    API_PROXY_TARGET=$API_PROXY_TARGET

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build \
    && mkdir -p .next/standalone/.next \
    && cp -R .next/static .next/standalone/.next/static \
    && cp -R public .next/standalone/public \
    && test -f .next/standalone/server.js \
    && test -d .next/standalone/.next/static


FROM node:20-alpine AS runner

ARG NEXT_PUBLIC_API_BASE
ARG API_PROXY_TARGET

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    API_PROXY_TARGET=$API_PROXY_TARGET

WORKDIR /app

COPY --from=builder /app/.next/standalone ./

RUN addgroup --system nextjs \
    && adduser --system --ingroup nextjs --home /app nextjs \
    && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
