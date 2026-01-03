#!/bin/bash
set -e

echo "🔨 Building Sanctum..."
npm run build

echo "🚀 Deploying to sanctum-vault.pages.dev..."
npx wrangler pages deploy out --project-name=sanctum-vault --commit-dirty=true

echo "✅ Deployment complete!"
