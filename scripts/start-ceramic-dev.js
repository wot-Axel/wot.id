// Start a local Ceramic node for development
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

// Configuration
const CERAMIC_DIR = './.ceramic';
const ADMIN_SEED_FILE = path.join(CERAMIC_DIR, 'admin-seed.json');

// Create necessary directories
if (!fs.existsSync(CERAMIC_DIR)) {
  fs.mkdirSync(CERAMIC_DIR, { recursive: true });
}

// Generate or load admin DID seed
let adminSeed;
if (fs.existsSync(ADMIN_SEED_FILE)) {
  console.log('Loading existing admin seed...');
  const seedData = JSON.parse(fs.readFileSync(ADMIN_SEED_FILE, 'utf-8'));
  adminSeed = new Uint8Array(seedData);
} else {
  console.log('Generating new admin seed...');
  adminSeed = randomBytes(32);
  fs.writeFileSync(
    ADMIN_SEED_FILE,
    JSON.stringify(Array.from(adminSeed)),
    'utf-8'
  );
}

// Create and authenticate admin DID
async function createAdminDID() {
  const provider = new Ed25519Provider(adminSeed);
  const did = new DID({
    provider,
    resolver: getResolver(),
  });
  await did.authenticate();
  return did;
}

// Main function to start Ceramic node
async function main() {
  try {
    console.log('Creating admin DID...');
    const adminDID = await createAdminDID();
    console.log(`Admin DID: ${adminDID.id}`);
    
    // Start the Ceramic daemon using ComposeDB CLI
    console.log('Starting Ceramic daemon...');
    const ceramicProcess = spawn('npx', [
      'ceramic',
      'daemon',
      '--network', 'testnet-clay',
      '--port', '7007',
      '--hostname', 'localhost',
      '--ipfs-api', 'http://localhost:5001',
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
    
    console.log('Ceramic node starting at http://localhost:7007');
    console.log('Press Ctrl+C to stop the node');
  } catch (error) {
    console.error('Failed to start Ceramic node:', error);
    process.exit(1);
  }
}

main();
