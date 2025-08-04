# ReadZone Next.js Production Dockerfile
# Multi-stage build for optimal security and performance

# ===================================
# Stage 1: Dependencies Installation
# ===================================
FROM node:18-alpine AS deps

# Install security updates and necessary packages
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --frozen-lockfile \
    && npm cache clean --force

# ===================================  
# Stage 2: Development Dependencies & Build
# ===================================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ===================================
# Stage 3: Production Runtime
# ===================================
FROM node:18-alpine AS runner

# Install security updates
RUN apk add --no-cache \
    dumb-init \
    && apk upgrade \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy production dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Create directories with proper permissions
RUN mkdir -p /app/.next/cache \
    && chown -R nextjs:nodejs /app

# Switch to non-root user for security
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]