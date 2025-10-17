FROM node:21-alpine
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --no-audit --no-fund

# Copy source code
COPY . .

# Expose port aplikasi
EXPOSE 3002

# Jalankan aplikasi langsung
CMD ["node", "server.js"]
