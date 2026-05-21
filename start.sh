#!/bin/sh
set -e

echo "=== ITM Bienestar API startup ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "REDIS_URL set:    $([ -n "$REDIS_URL" ] && echo YES || echo NO)"
echo "JWT_SECRET set:   $([ -n "$JWT_SECRET" ] && echo YES || echo NO)"
echo "================================="

echo "[1/2] Pushing database schema..."
npx prisma db push
echo "[1/2] Schema ready."

echo "[2/2] Starting server..."
node dist/server.js
