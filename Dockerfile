# Multi-stage build: Vite frontend -> nginx
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --frozen-lockfile
COPY frontend/ .
# Build without VITE_API_URL so the frontend uses relative /api/ URLs
# nginx will proxy /api/* to the Railway backend
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]