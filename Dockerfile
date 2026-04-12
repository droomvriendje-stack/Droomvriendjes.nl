# Multi-stage build: Vite frontend -> nginx
FROM node:20-alpine AS builder
ARG VITE_API_URL=https://web-production-3e5df6.up.railway.app
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --frozen-lockfile
COPY frontend/ .
# Embed VITE_API_URL in the bundle at build time so the frontend can reach the backend
RUN VITE_API_URL=${VITE_API_URL} npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]