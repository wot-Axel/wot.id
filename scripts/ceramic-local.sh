#!/bin/bash

# Create necessary directories
mkdir -p ./.ceramic/statestore

# Start the Ceramic daemon using a remote IPFS node
echo "Starting local Ceramic node with remote IPFS..."
npx ceramic daemon \
  --network testnet-clay \
  --port 7007
