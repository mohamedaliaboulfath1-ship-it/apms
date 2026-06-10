#!/bin/bash
set -e

echo "🚀 APMS Setup Script"
echo "===================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Environment file
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "📝 Created .env.local — update with your Supabase credentials"
fi

# GitHub setup
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "🔗 Creating GitHub repository..."
    gh repo create apms --public --source=. --remote=origin --description "Advance & Petty Cash Management System" 2>/dev/null || echo "ℹ️  Repo may already exist"
    git push -u origin main 2>/dev/null || echo "ℹ️  Push manually: git push -u origin main"
  else
    echo "⚠️  GitHub CLI not authenticated. Run: gh auth login"
  fi
else
  echo "⚠️  GitHub CLI not installed. Install: brew install gh"
fi

# Supabase setup instructions
echo ""
echo "📊 Supabase Setup:"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Create new project: 'apms-production'"
echo "  3. Go to SQL Editor → paste supabase/migrations/001_initial_schema.sql"
echo "  4. Run supabase/seed.sql for demo data"
echo "  5. Copy Project URL and anon key to .env.local"
echo ""

# Vercel setup
echo "🌐 Vercel Deployment:"
echo "  npx vercel"
echo "  Set env vars from .env.example in Vercel dashboard"
echo ""

echo "✅ Setup complete! Run: npm run dev"
