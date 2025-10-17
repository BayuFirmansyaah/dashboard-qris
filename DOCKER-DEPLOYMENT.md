# 🐳 QRIS Generator - Docker Deployment Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- Port 3001 available
- Base template file (`base_template.png`) di root directory

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd qris-transction
```

### 2. Pastikan Template Ada
```bash
# Pastikan file base_template.png ada di root directory
ls -la base_template.png
```

### 3. Build & Run dengan Docker Compose
```bash
# Build dan jalankan container
docker-compose up -d

# Atau build ulang jika ada perubahan
docker-compose up -d --build
```

### 4. Akses Aplikasi
- **URL:** http://localhost:3002
- **Quick Generate:** http://localhost:3002/qris-auto.html
- **Advanced Template:** http://localhost:3002/qris-advanced.html

## 🔧 Docker Commands

### Build Manual
```bash
# Build image
docker build -t qris-generator .

# Run container
docker run -d \
  --name qris-app \
  -p 3002:3002 \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -v $(pwd)/public/generated:/app/public/generated \
  -v $(pwd)/base_template.png:/app/base_template.png \
  qris-generator
```

### Management Commands
```bash
# Lihat logs
docker-compose logs -f qris-app

# Stop containers
docker-compose down

# Restart services
docker-compose restart

# Update dan rebuild
docker-compose down
docker-compose up -d --build
```

## 📁 Volume Mounts

Container menggunakan volume mounts untuk:
- `./public/uploads` → Upload gambar QRIS
- `./public/generated` → File QRIS hasil generate
- `./base_template.png` → Template untuk advanced mode

## 🔍 Health Check

Container memiliki health check yang mengecek:
- HTTP response pada port 3002
- Interval: 30 detik
- Timeout: 10 detik
- Retries: 3 kali

## 🌐 Production Deployment

### Environment Variables
```bash
export NODE_ENV=production
export PORT=3002
```

### Nginx Reverse Proxy (Optional)
Uncomment bagian nginx di `docker-compose.yml` dan buat `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream qris_app {
        server qris-app:3002;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://qris_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 🔒 Security Notes

1. **File Permissions:** Container sets proper permissions for upload directories
2. **Health Checks:** Built-in health monitoring
3. **Resource Limits:** Consider adding resource limits in production
4. **SSL/TLS:** Use nginx with SSL for production

## 🐛 Troubleshooting

### Container tidak start
```bash
# Check logs
docker-compose logs qris-app

# Check if port is available
netstat -tulpn | grep :3002
```

### Permission issues
```bash
# Fix permissions
sudo chown -R $USER:$USER public/
chmod -R 755 public/
```

### Template missing
```bash
# Pastikan base_template.png ada
ls -la base_template.png

# Copy template jika belum ada
cp path/to/your/template.png base_template.png
```

## 📊 Monitoring

### Resource Usage
```bash
# Check container stats
docker stats qris-generator

# Check disk usage
docker system df
```

### Logs
```bash
# Follow logs
docker-compose logs -f --tail=100 qris-app

# Check specific time
docker-compose logs --since="2024-01-01T00:00:00Z" qris-app
```

---

**Last Updated:** October 17, 2025  
**Version:** 1.0.0