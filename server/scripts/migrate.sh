#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until mysqladmin ping -h"${MYSQL_HOST:-mysql}" -P"${MYSQL_PORT:-3306}" -u"${MYSQL_USER:-pm}" -p"${MYSQL_PASSWORD:-pm123456}" --silent; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready - running migrations"
npm run migration:run

echo "Migrations completed"
