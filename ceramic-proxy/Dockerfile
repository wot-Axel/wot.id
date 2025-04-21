FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY server.js ./

# Set environment variables
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the proxy server
CMD ["node", "server.js"]
