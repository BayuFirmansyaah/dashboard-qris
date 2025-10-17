@echo off
echo 🚀 QRIS Generator - Prepare for CapRover Deploy
echo ==============================================

echo 📁 Checking current file structure...
dir public

echo.
echo 📝 Adding all changes to git...
git add .

echo.
echo 💾 Committing changes...
git commit -m "fix: explicit copy public folder for docker build"

echo.
echo 📤 Pushing to repository...
git push origin master

echo.
echo ✅ Repository updated!
echo.
echo 🎯 CapRover Instructions:
echo 1. Go to your CapRover app
echo 2. Deploy from Git Repository
echo 3. Set App HTTP Port: 3002
echo 4. Use Dockerfile.explicit for build
echo.
echo 🔧 Alternative: Use these Docker commands locally:
echo docker build -f Dockerfile.explicit -t qris-test .
echo docker run -p 3002:3002 qris-test
echo.
pause