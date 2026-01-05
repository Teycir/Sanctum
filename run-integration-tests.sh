#!/bin/bash

# Vault Expiry Integration Test Runner
# This script helps you run the integration tests

echo "🧪 Vault Expiry Integration Test Runner"
echo "========================================"
echo ""

# Check if build exists
if [ ! -d "out" ]; then
    echo "📦 Building Next.js app..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
    echo "✅ Build complete"
    echo ""
fi

echo "📋 Instructions:"
echo ""
echo "1. Open a NEW terminal and run:"
echo "   cd $(pwd)"
echo "   npm start"
echo ""
echo "2. Wait for 'Ready on http://localhost:8788'"
echo ""
echo "3. Press ENTER here to run integration tests..."
read -p ""

echo ""
echo "🧪 Running integration tests..."
npm test -- __tests__/vault-expiry.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All integration tests passed!"
    echo "🎉 Vault expiry feature is 100% verified!"
else
    echo ""
    echo "❌ Some tests failed"
    echo "💡 Make sure the backend is running (npm start)"
fi
