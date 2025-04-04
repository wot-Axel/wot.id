#!/bin/bash

# Exit on error
set -e

echo "Starting Ceramic daemon with bundled IPFS..."
npx ceramic daemon --config ceramic.config.json --port 7007

echo "Ceramic daemon started at http://localhost:7007"
