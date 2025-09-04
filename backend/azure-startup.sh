#!/bin/bash

echo "Starting SquadPot Backend on Azure..."

# Set environment
export NODE_ENV=production

# Ensure database migrations are run
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting Node.js application..."
node dist/src/main.server.js