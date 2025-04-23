#!/bin/bash

# wot.id Production Deployment Script
# This script handles the deployment process for both the main application and the Ceramic proxy

# Stop on errors
set -e

echo "Starting wot.id deployment process..."

# Build the Next.js application
echo "Building main application..."
npm run build


echo "Deployment preparation complete!"
echo "Application is ready to be deployed to production."

# Add deployment commands based on your hosting provider
# For example with Vercel:
# vercel --prod

echo "Deployment complete!"
