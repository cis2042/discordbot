FROM node:16-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p logs src/web/views src/web/public src/web/public/css src/web/public/js

# Set environment variables
ENV NODE_ENV=production
ENV USE_MOCK_MODE=false

# Expose port for web server
EXPOSE 3000
EXPOSE 3001

# Set up healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Run the application
CMD ["node", "src/index.js"]