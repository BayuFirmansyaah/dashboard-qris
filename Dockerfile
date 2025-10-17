FROM node:21-alpine
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --no-audit --no-fund

# Copy ENTIRE project (including public folder)
COPY . .

# Verify files exist (for debugging)
RUN ls -la public/
RUN ls -la public/qris-auto.html || echo "qris-auto.html NOT FOUND"

# Create necessary directories if they don't exist
RUN mkdir -p public/uploads public/generated

# Expose port aplikasi
EXPOSE 3002

# Jalankan aplikasi langsung
CMD ["node", "server.js"]
