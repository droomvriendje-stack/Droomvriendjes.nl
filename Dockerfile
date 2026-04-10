# Multi-stage build: Vite frontend -> nginx
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["/bin/sh", "-c", "sed -i \"s/NGINX_PORT_PLACEHOLDER/$PORT/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]