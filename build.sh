#!/bin/bash

echo "🐳 QRIS Generator - Docker Build Script"
echo "======================================="

# Function untuk cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker system prune -f
}

# Function untuk build dengan error handling
build_with_fallback() {
    echo "🔨 Attempting to build with Dockerfile.simple..."
    
    if docker-compose -f docker-compose.yml build; then
        echo "✅ Build successful with Dockerfile.simple!"
        return 0
    fi
    
    echo "❌ Build failed with Dockerfile.simple"
    echo "🔨 Trying with main Dockerfile..."
    
    # Update docker-compose to use main Dockerfile
    sed -i 's/dockerfile: Dockerfile.simple/dockerfile: Dockerfile/' docker-compose.yml
    
    if docker-compose build; then
        echo "✅ Build successful with main Dockerfile!"
        return 0
    fi
    
    echo "❌ Build failed with main Dockerfile"
    echo "🔨 Trying with Ubuntu Dockerfile..."
    
    # Update docker-compose to use Ubuntu Dockerfile
    sed -i 's/dockerfile: Dockerfile/dockerfile: Dockerfile.ubuntu/' docker-compose.yml
    
    if docker-compose build; then
        echo "✅ Build successful with Ubuntu Dockerfile!"
        return 0
    fi
    
    echo "❌ All build attempts failed!"
    return 1
}

# Main execution
echo "🚀 Starting build process..."

# Clean up first
cleanup

# Attempt build with fallback
if build_with_fallback; then
    echo ""
    echo "🎉 Build completed successfully!"
    echo "🚀 You can now run: docker-compose up -d"
    echo "🌐 Access at: http://localhost:3002"
else
    echo ""
    echo "💥 Build failed completely!"
    echo "📋 Troubleshooting steps:"
    echo "1. Check if all dependencies are in package.json"
    echo "2. Try: rm -rf node_modules package-lock.json && npm install"
    echo "3. Check Docker system resources"
    echo "4. Try building without Docker cache: docker-compose build --no-cache"
fi