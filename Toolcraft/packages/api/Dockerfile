# packages/api/Dockerfile

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json yarn.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build shared package first
RUN yarn workspace @toolcraft/shared build

# Build API
RUN yarn workspace @toolcraft/api build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package.json yarn.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy built packages
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/api/dist ./packages/api/dist

# Create uploads directory
RUN mkdir -p /app/packages/api/uploads

# Expose API port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Start the API server
CMD ["node", "packages/api/dist/app.js"]