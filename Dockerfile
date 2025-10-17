# Gunakan base image Node.js versi 20 (LTS) atau 22
FROM node:20-alpine

# Set working directory
WORKDIR /

# Install dependencies sistem yang dibutuhkan Chromium
RUN apk add --no-cache \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    bash \
    curl \
    openssl


# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua source code
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port aplikasi
EXPOSE 3002

# Jalankan entrypoint
ENTRYPOINT ["/entrypoint.sh"]
