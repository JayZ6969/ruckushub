#!/bin/bash

# RuckusHub Deployment Script for Linux

echo "🚀 Starting RuckusHub deployment..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations and seed
echo "📊 Setting up database..."
docker-compose exec ruckushub npx prisma migrate deploy
docker-compose exec ruckushub npx prisma db seed

# Show container status
echo "📋 Container status:"
docker-compose ps

echo "✅ Deployment complete!"
echo "🌐 Your RuckusHub is now running at http://your-server-ip:3000"
