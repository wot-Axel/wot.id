#!/bin/bash

# Exit on error
set -e

# Configuration
CERAMIC_DIR="./.ceramic"
IPFS_DIR="${CERAMIC_DIR}/ipfs"

# Create necessary directories
mkdir -p "${CERAMIC_DIR}"
mkdir -p "${IPFS_DIR}"

# Function to check if IPFS is running
function is_ipfs_running() {
  ipfs swarm peers &>/dev/null
  return $?
}

# Function to check if Ceramic is running
function is_ceramic_running() {
  curl -s http://localhost:7007/api/v0/node/healthcheck &>/dev/null
  return $?
}

# Stop existing processes if they're running
echo "Checking for existing processes..."
if is_ipfs_running; then
  echo "Stopping existing IPFS daemon..."
  pkill -f "ipfs daemon" || true
  sleep 2
fi

if is_ceramic_running; then
  echo "Stopping existing Ceramic daemon..."
  pkill -f "ceramic daemon" || true
  sleep 2
fi

# Initialize IPFS if needed
if [ ! -f "${IPFS_DIR}/config" ]; then
  echo "Initializing IPFS..."
  IPFS_PATH="${IPFS_DIR}" ipfs init
fi

# Configure IPFS for Ceramic
echo "Configuring IPFS for Ceramic..."
IPFS_PATH="${IPFS_DIR}" ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
IPFS_PATH="${IPFS_DIR}" ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'

# Start IPFS daemon
echo "Starting IPFS daemon..."
IPFS_PATH="${IPFS_DIR}" ipfs daemon --enable-pubsub-experiment &
IPFS_PID=$!

# Wait for IPFS to start
echo "Waiting for IPFS to start..."
sleep 5

# Check if IPFS is running
if ! is_ipfs_running; then
  echo "Failed to start IPFS daemon"
  exit 1
fi

echo "IPFS daemon is running (PID: ${IPFS_PID})"

# Start Ceramic daemon
echo "Starting Ceramic daemon..."
npx ceramic daemon --network testnet-clay --ipfs-api http://localhost:5001 --port 7007 &
CERAMIC_PID=$!

# Wait for Ceramic to start
echo "Waiting for Ceramic to start..."
sleep 10

# Check if Ceramic is running
if ! is_ceramic_running; then
  echo "Failed to start Ceramic daemon"
  kill $IPFS_PID
  exit 1
fi

echo "Ceramic daemon is running (PID: ${CERAMIC_PID})"
echo "Local Ceramic node is available at http://localhost:7007"
echo "Press Ctrl+C to stop both daemons"

# Handle shutdown
function cleanup() {
  echo "Shutting down Ceramic and IPFS..."
  kill $CERAMIC_PID $IPFS_PID
  exit 0
}

trap cleanup INT TERM

# Keep the script running
wait
