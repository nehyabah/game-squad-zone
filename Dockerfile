# Multi-stage Docker build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Copy frontend package files
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy and build backend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend ./backend/

WORKDIR /app/backend
RUN npm ci
RUN npx prisma generate
RUN npm run build

# Copy and build frontend
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm ci
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy backend files
COPY --from=deps --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma
COPY --from=builder --chown=nodejs:nodejs /app/backend/package*.json ./backend/

# Copy frontend build
COPY --from=builder --chown=nodejs:nodejs /app/dist ./frontend/dist

# Copy nginx config for serving frontend
COPY nginx.conf /etc/nginx/nginx.conf

USER nodejs

EXPOSE 80 3001

# Start script that runs both backend and serves frontend
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]