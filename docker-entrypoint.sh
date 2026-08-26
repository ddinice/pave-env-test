#!/bin/sh
set -eu

until nc -z db 5432; do
  echo "Waiting for Postgres at db:5432..."
  sleep 1
done

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx tsx prisma/seed.ts

exec "$@"
