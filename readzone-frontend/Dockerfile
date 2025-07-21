# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy custom nginx site configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S readzone -u 1001 -G nginx

# Change ownership of nginx directories
RUN chown -R readzone:nginx /var/cache/nginx && \
    chown -R readzone:nginx /var/log/nginx && \
    chown -R readzone:nginx /etc/nginx/conf.d && \
    chown -R readzone:nginx /usr/share/nginx/html

# Create nginx runtime directories
RUN mkdir -p /var/run/nginx && \
    chown -R readzone:nginx /var/run/nginx

# Switch to non-root user
USER readzone

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]