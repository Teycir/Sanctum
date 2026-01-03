#!/bin/bash

echo "🔧 Setting up Cloudflare D1 Database..."

# Create database
echo "📦 Creating database..."
npx wrangler d1 create sanctum-keys

echo ""
echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo ""
read -p "Press Enter after updating wrangler.toml..."

# Run migrations
echo "🔄 Running migrations..."
npx wrangler d1 execute sanctum-keys --file=./schema.sql

# Verify
echo "✅ Verifying tables..."
npx wrangler d1 execute sanctum-keys --command="SELECT name FROM sqlite_master WHERE type='table'"

echo ""
echo "✨ Database setup complete!"
echo "📖 See docs/DATABASE-SETUP.md for more details"
