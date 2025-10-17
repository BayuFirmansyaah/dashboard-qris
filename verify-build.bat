@echo off
echo 🔍 QRIS Generator - Pre-Deploy Verification
echo ==========================================

echo 📁 Checking required files...

if exist "public\qris-auto.html" (
    echo ✅ public\qris-auto.html - OK
) else (
    echo ❌ public\qris-auto.html - MISSING
    goto error
)

if exist "public\qris-advanced.html" (
    echo ✅ public\qris-advanced.html - OK
) else (
    echo ❌ public\qris-advanced.html - MISSING
    goto error
)

if exist "public\index.html" (
    echo ✅ public\index.html - OK
) else (
    echo ❌ public\index.html - MISSING
    goto error
)

if exist "server.js" (
    echo ✅ server.js - OK
) else (
    echo ❌ server.js - MISSING
    goto error
)

if exist "package.json" (
    echo ✅ package.json - OK
) else (
    echo ❌ package.json - MISSING
    goto error
)

echo.
echo 🐳 Building Docker image...
docker build -t qris-generator .

if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker build successful!
    echo 🚀 Ready for CapRover deployment
    echo.
    echo 📋 CapRover Settings:
    echo - App HTTP Port: 3002
    echo - Build Command: default
    echo - Files verified and ready
) else (
    echo ❌ Docker build failed!
    goto error
)

goto end

:error
echo.
echo 💥 Pre-deploy check failed!
echo Please fix the issues above before deploying to CapRover.

:end
pause