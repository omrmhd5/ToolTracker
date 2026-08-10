#!/bin/sh
set -e

echo "Applying database migrations..."
./node_modules/.bin/tsx src/db/migrate.ts

echo "Starting Tool Tracker..."
exec node server.js
