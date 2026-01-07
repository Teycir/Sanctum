#!/bin/bash
# Database migration script for Cloudflare D1

set -e

echo "🔄 Running database migrations..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Run migrations in order
for migration in migrations/*.sql; do
    echo "📝 Applying migration: $migration"
    wrangler d1 execute DB --file="$migration"
done

echo "✅ All migrations applied successfully!"
