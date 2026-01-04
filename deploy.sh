#!/bin/bash
set -e

echo "🚀 Sanctum Deployment Script"
echo "=============================="

# Check if logged in
if ! npx wrangler whoami &>/dev/null; then
    echo "❌ Not logged in to Cloudflare"
    echo "Run: npx wrangler login"
    exit 1
fi

# Check environment variable
if [ -z "$VAULT_ENCRYPTION_SECRET" ]; then
    echo "⚠️  VAULT_ENCRYPTION_SECRET not set"
    echo "Generate one with: openssl rand -base64 32"
    echo "Set in Cloudflare Pages dashboard"
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build
echo "🔨 Building..."
npm run build

# Deploy
echo "📦 Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=sanctum-vault

echo "✅ Deployment complete!"
echo "📊 Check status: https://dash.cloudflare.com/pages"
