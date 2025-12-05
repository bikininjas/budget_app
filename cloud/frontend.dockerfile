# Dockerfile optimisé pour Cloud Run
FROM node:22-alpine AS base

# Install bun
RUN npm install -g bun

# Dependencies
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

# Builder
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# L'URL de l'API sera injectée au runtime via variable d'environnement
# On utilise une valeur placeholder qui sera remplacée
ARG NEXT_PUBLIC_API_URL=https://BACKEND_URL_PLACEHOLDER
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN bun run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run utilise PORT (défaut 8080)
ENV PORT=3000
EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
