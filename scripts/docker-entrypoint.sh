#!/bin/sh
set -e

echo "Veritabanı şeması uygulanıyor..."
node /opt/prisma-cli/node_modules/prisma/build/index.js db push --skip-generate --schema=/app/prisma/schema.prisma

echo "Admin hesabı kontrol ediliyor..."
node /app/scripts/ensure-admin.mjs

echo "Uygulama başlıyor..."
exec su-exec nextjs node server.js
