#!/bin/bash

# Production Deployment Script
# This script runs all pre-deployment checks and validation

set -e  # Exit on any error

echo "🚀 NetTap Production Deployment Preparation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo ""

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check
echo ""

# Run tests
echo "🧪 Running tests..."
npm test
echo ""

# Validate environment
echo "🔐 Validating environment configuration..."
npm run validate:env
echo ""

# Build application
echo "🏗️  Building application..."
npm run build
echo ""

# Final checks
echo "✅ All pre-deployment checks passed!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next steps:"
echo "   1. Review PRODUCTION_CHECKLIST.md"
echo "   2. Set environment variables in deployment platform"
echo "   3. Deploy using your chosen platform (Vercel/Fly.io/Render/Docker)"
echo "   4. Verify health endpoint: https://your-domain.com/api/health"
echo ""
echo "📚 Documentation:"
echo "   - Deployment guide: DEPLOYMENT.md"
echo "   - Production checklist: PRODUCTION_CHECKLIST.md"
echo ""
echo "🎉 Ready for production deployment!"
