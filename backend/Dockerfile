# backend/Dockerfile
FROM node:18-alpine

# Install PostgreSQL client and OpenSSL
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    ca-certificates

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma client with binary targets for Alpine
RUN npx prisma generate

# Copy all source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove mock server files to prevent fallback
RUN rm -f server.js server.mock.js

# Create startup script using echo instead of cat
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "========================================="' >> start.sh && \
    echo 'echo "SQUADPOT BACKEND - PRODUCTION"' >> start.sh && \
    echo 'echo "PORT: ${PORT:-3001}"' >> start.sh && \
    echo 'echo "NODE_ENV: ${NODE_ENV:-production}"' >> start.sh && \
    echo 'echo "========================================="' >> start.sh && \
    echo 'echo "Running database migrations..."' >> start.sh && \
    echo 'npx prisma migrate deploy || echo "Migration warnings"' >> start.sh && \
    echo 'echo "Starting Fastify server..."' >> start.sh && \
    echo 'exec node dist/main.server.js' >> start.sh && \
    chmod +x start.sh

# Expose port
EXPOSE 8080

# Start the application
CMD ["./start.sh"]