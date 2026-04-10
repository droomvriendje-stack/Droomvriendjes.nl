# Multi-stage build: Vite frontend -> nginx
# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ .

# Build the Vite app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config with /health endpoint and SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]