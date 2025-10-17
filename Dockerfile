# Gunakan base image Node.js versi 18 (LTS stable)
FROM node:18-alpine

# Set working directory yang benar
WORKDIR /app

# Install dependencies sistem yang dibutuhkan
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    bash \
    curl

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies dengan error handling
RUN npm cache clean --force && \
    npm install --production --no-audit --no-fund && \
    npm cache clean --force

# Copy semua source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads public/generated

# Set permissions
RUN chmod -R 755 public/

# Expose port aplikasi
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Jalankan aplikasi langsung
CMD ["node", "server.js"]
