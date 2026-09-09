# syntax=docker/dockerfile:1

# Stage 1: Build static React + TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY frontend/package*.json ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy frontend source code
COPY frontend/ ./

# Build production distribution
RUN npm run build

# Stage 2: Serve optimized assets via high-performance Nginx reverse proxy
FROM nginx:1.27-alpine

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Copy built application assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
