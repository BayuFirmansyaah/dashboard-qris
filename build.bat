@echo off
echo 🐳 QRIS Generator - Smart Docker Build Script
echo ============================================

echo 🧹 Cleaning up Docker system...
docker system prune -f

echo 🔨 Strategy 1: Building with main Dockerfile...
docker-compose build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful with main Dockerfile!
    goto success
)

echo ❌ Main Dockerfile failed, trying Dockerfile.simple...
echo 📝 Updating docker-compose.yml to use Dockerfile.simple...
powershell -Command "(Get-Content docker-compose.yml) -replace 'dockerfile: Dockerfile', 'dockerfile: Dockerfile.simple' | Set-Content docker-compose.yml"

docker-compose build --no-cache

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful with Dockerfile.simple!
    goto success
)

echo ❌ Dockerfile.simple failed, trying Ubuntu version...
powershell -Command "(Get-Content docker-compose.yml) -replace 'dockerfile: Dockerfile.simple', 'dockerfile: Dockerfile.ubuntu' | Set-Content docker-compose.yml"

docker-compose build --no-cache

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful with Dockerfile.ubuntu!
    goto success
)

echo ❌ All Docker strategies failed!
echo 🔧 Running NPM fix script...
call fix-npm.bat
goto end

:success
echo 🚀 Starting containers...
docker-compose up -d
echo 🌐 Access at: http://localhost:3002
echo ✅ Deployment successful!

:end
pause