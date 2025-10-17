@echo off
echo 🔧 QRIS Generator - Fix NPM Dependencies
echo ========================================

echo 🧹 Cleaning npm cache and dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 📦 Reinstalling dependencies...
npm cache clean --force
npm install

if %ERRORLEVEL% EQU 0 (
    echo ✅ Dependencies installed successfully!
    echo 🐳 Now trying Docker build...
    docker-compose build --no-cache
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Docker build successful!
        echo 🚀 Starting containers...
        docker-compose up -d
        echo 🌐 Access at: http://localhost:3002
    ) else (
        echo ❌ Docker build failed
        echo 💡 Try running: docker-compose -f docker-compose.yml build
    )
) else (
    echo ❌ NPM install failed
    echo 💡 Check your internet connection and try again
)

pause