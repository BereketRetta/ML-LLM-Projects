# packages/web/Dockerfile

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json yarn.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build shared package first
RUN yarn workspace @toolcraft/shared build

# Build web package
RUN yarn workspace @toolcraft/web build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]