# Production image: build the SPA, serve static files with Nginx and proxy /api to Laravel (php-fpm).
# Build: docker build -t rgoli-front .

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild esbuild
COPY . .
# Same-origin API (/api proxied by this Nginx), so VITE_API_URL stays empty.
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
