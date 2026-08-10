#!/bin/sh
set -e

echo "Applying database migrations..."
./node_modules/.bin/tsx src/db/migrate.ts

echo "Seeding default users..."
./node_modules/.bin/tsx src/db/seed.ts

echo "Starting Tool Tracker..."
exec node server.js
