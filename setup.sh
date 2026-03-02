#!/bin/bash
# Synapse Development Setup Script
# Run this to get started quickly

set -e

echo "🚀 Synapse Development Setup"
echo "============================"
echo ""

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker is recommended but not required for local development"; }

# Backend setup
echo "📦 Setting up backend..."
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✓ Backend dependencies already installed"
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Backend .env created from .env.example"
else
    echo "✓ Backend .env already exists"
fi

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Frontend .env created from .env.example"
else
    echo "✓ Frontend .env already exists"
fi

cd ..

# Database setup (optional)
echo ""
if command -v docker >/dev/null 2>&1; then
    read -p "🐳 Start PostgreSQL with Docker? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose up -d db
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        echo "✅ Database started"
        
        read -p "📊 Run database migrations? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run db:migrate
            echo "✅ Database migrations completed"
        fi
    fi
else
    echo "⚠️  Docker not available. Please set up PostgreSQL manually."
    echo "   Update DATABASE_URL in .env with your connection string."
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update .env files with your configuration"
echo "  2. Start backend: npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Or use Docker: docker-compose up"
echo ""
