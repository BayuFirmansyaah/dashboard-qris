# 🐛 Docker Build Troubleshooting Guide

## ❌ Common Error: npm ci failed

**Error:** `The command '/bin/sh -c npm ci --only=production && npm cache clean --force' returned a non-zero code: 1`

## 🔧 Solutions (Try in Order)

### 1. Quick Fix - Use Simple Dockerfile
```bash
# Gunakan Dockerfile yang lebih simple
docker-compose -f docker-compose.yml build
```

### 2. Clean Build
```bash
# Clean Docker cache
docker system prune -f
docker-compose build --no-cache
```

### 3. Fix Dependencies Locally
```bash
# Hapus dependencies dan install ulang
rm -rf node_modules package-lock.json
npm install
docker-compose build
```

### 4. Use Alternative Dockerfile
```bash
# Edit docker-compose.yml, ganti:
dockerfile: Dockerfile.simple
# dengan:
dockerfile: Dockerfile.ubuntu
```

### 5. Manual Build Steps
```bash
# Build image step by step
docker build -f Dockerfile.simple -t qris-generator .
docker run -d -p 3002:3002 --name qris-app qris-generator
```

## 🛠️ Build Scripts

### Windows
```cmd
.\build.bat
```

### Linux/Mac
```bash
chmod +x build.sh
./build.sh
```

## 📋 Available Dockerfiles

1. **`Dockerfile`** - Alpine with full dependencies
2. **`Dockerfile.simple`** - Slim with minimal deps (recommended)
3. **`Dockerfile.ubuntu`** - Ubuntu base (fallback)

## 🔍 Debugging Commands

```bash
# Check Docker system
docker system df
docker system info

# Check build logs
docker-compose logs qris-app

# Interactive debug
docker run -it --rm node:18-slim /bin/bash
```

## 🚀 Quick Deploy (If Build Works)

```bash
# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f qris-app

# Access app
curl http://localhost:3002
```

## 💡 Prevention Tips

1. **Regular cleanup:** `docker system prune -f`
2. **Use .dockerignore:** Already included
3. **Minimal dependencies:** Keep package.json clean
4. **Layer optimization:** Dependencies first, code later

---

**If nothing works:** Create GitHub issue with full error logs