/**
 * Local Ceramic Node Setup Script
 * This script sets up a local Ceramic node with IPFS for development
 */

import { createCeramic } from '@composedb/devtools-node';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

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
    console.log('Starting local Ceramic node...');
    
    // Create admin DID
    const adminDID = await createAdminDID();
    console.log(`Admin DID: ${adminDID.id}`);
    
    // Create Ceramic node with admin DID
    const ceramic = await createCeramic({
      did: adminDID,
      anchorOnRequest: false, // Set to true to enable anchoring
      streamCacheLimit: 100,
      pubsubTopic: '/ceramic/local-dev', // Custom topic for local development
      networkName: 'local-dev',
      ipfsOptions: {
        repo: path.join(CERAMIC_DIR, 'ipfs'),
      },
    });
    
    console.log(`Ceramic node running at ${ceramic.url}`);
    console.log('Press Ctrl+C to stop the node');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Shutting down Ceramic node...');
      await ceramic.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start Ceramic node:', error);
    process.exit(1);
  }
}

main();
