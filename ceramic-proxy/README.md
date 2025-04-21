# Ceramic Network CORS Proxy

This proxy server enables direct browser access to the Ceramic Network by handling CORS restrictions.

## Deployment Options

### 1. Deploy as a Standalone Service

Deploy this proxy as a separate service on the same domain or subdomain as your main application.

```bash
# Install dependencies
npm install

# Start the server
npm start
```

### 2. Deploy with Docker

```bash
# Build the Docker image
docker build -t ceramic-proxy .

# Run the container
docker run -p 8080:8080 ceramic-proxy
```

### 3. Deploy to Cloud Provider

The proxy can be deployed to any cloud provider that supports Node.js applications or Docker containers.

Recommended services:
- Vercel Serverless Functions
- AWS Lambda with API Gateway
- Digital Ocean App Platform
- Render
- Railway

## Production Configuration

When deployed, update the `proxyUrl` in your main application's `ceramicConfig.ts` to point to the production URL of your proxy server.
