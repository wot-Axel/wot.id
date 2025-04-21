#!/bin/bash

# wot.id Production Deployment Script
# This script handles the deployment process for both the main application and the Ceramic proxy

# Stop on errors
set -e

echo "Starting wot.id deployment process..."

# Register Ceramic DID (only needs to be done once, but safe to run again)
echo "Registering Ceramic DID..."
npm run ceramic:register

# Build the Next.js application
echo "Building main application..."
npm run build

# Build the Ceramic proxy
echo "Building Ceramic proxy..."
cd ceramic-proxy
npm install
cd ..

echo "Deployment preparation complete!"
echo "Application is ready to be deployed to production."

# Add deployment commands based on your hosting provider
# For example with Vercel:
# vercel --prod

echo "Deployment complete!"
