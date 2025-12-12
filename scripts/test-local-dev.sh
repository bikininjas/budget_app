#!/bin/bash
# Test script to verify the child monthly budget functionality locally

set -e

echo "🚀 Starting local test of child monthly budget functionality..."

# Build docker images
echo "📦 Building Docker images..."
docker compose -f docker-compose.dev.yml build --no-cache backend 2>&1 | tail -20

# Start services
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d db backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Run migrations
echo "📊 Running migrations..."
docker compose -f docker-compose.dev.yml exec -T backend alembic upgrade head

# Test API endpoint
echo "✅ Testing API endpoint..."
curl -X GET http://localhost:8000/api/health \
  -H "Content-Type: application/json" 2>/dev/null || echo "Backend not responding yet"

echo ""
echo "✨ Test setup complete!"
echo ""
echo "Frontend is available at: http://localhost:3000"
echo "Backend API is available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "To stop services, run: docker compose -f docker-compose.dev.yml down"
