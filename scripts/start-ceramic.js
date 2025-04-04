/**
 * Start Local Ceramic Node
 * This script starts a local Ceramic node for development
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CERAMIC_DIR = './.ceramic';
const ADMIN_SEED_FILE = path.join(CERAMIC_DIR, 'admin-seed.json');

// Create necessary directories
if (!fs.existsSync(CERAMIC_DIR)) {
  fs.mkdirSync(CERAMIC_DIR, { recursive: true });
}

// Start the Ceramic daemon
console.log('Starting local Ceramic node...');

// Use the ComposeDB CLI to start a local Ceramic node
const ceramicProcess = spawn('npx', [
  'composedb', 
  'daemon', 
  '--network=testnet-clay',
  `--state-store=${CERAMIC_DIR}/statestore`,
  '--port=7007',
  '--hostname=localhost',
  '--debug'
], {
  stdio: 'inherit',
  shell: true
});

// Handle process events
ceramicProcess.on('error', (error) => {
  console.error('Failed to start Ceramic node:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Ceramic node...');
  ceramicProcess.kill('SIGINT');
  process.exit(0);
});

console.log('Ceramic node starting. Press Ctrl+C to stop.');
