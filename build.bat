@echo off
echo 🐳 QRIS Generator - Docker Build Script
echo =======================================

echo 🧹 Cleaning up Docker system...
docker system prune -f

echo 🔨 Attempting to build with Dockerfile.simple...
docker-compose -f docker-compose.yml build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    echo 🚀 You can now run: docker-compose up -d
    echo 🌐 Access at: http://localhost:3002
    goto :end
)

echo ❌ Build failed with Dockerfile.simple
echo 🔨 Trying alternative approaches...

echo.
echo 💡 Manual troubleshooting steps:
echo 1. Delete node_modules and package-lock.json
echo 2. Run: npm install
echo 3. Try: docker-compose build --no-cache
echo 4. Check Docker resources and restart Docker Desktop

:end
pause