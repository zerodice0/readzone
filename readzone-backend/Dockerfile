# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S readzone -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=readzone:nodejs /app/dist ./dist
COPY --from=builder --chown=readzone:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=readzone:nodejs /app/package*.json ./
COPY --from=builder --chown=readzone:nodejs /app/prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER readzone

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { host: 'localhost', port: 3001, path: '/api/health', timeout: 2000 }; \
               const request = http.request(options, (res) => { \
                 if (res.statusCode === 200) process.exit(0); \
                 else process.exit(1); \
               }); \
               request.on('error', () => process.exit(1)); \
               request.end();"

# Start the application
CMD ["npm", "start"]