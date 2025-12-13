# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Disable prepare scripts (husky, etc.) during install
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:lts-alpine AS production

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set environment variable to skip prepare scripts
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies and ignore scripts (no husky in production)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY app-config.json ./
COPY app-config.production.json ./

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 8080

CMD ["node", "dist/main.js"]
