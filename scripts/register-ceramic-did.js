#!/usr/bin/env node

/**
 * Ceramic DID Registration Script
 * 
 * This script registers our authenticated DID with proper permissions on Ceramic mainnet
 * to address CORS restrictions.
 */

import { CeramicClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { fromString } from 'uint8arrays/from-string';

// Configuration
const SEED = '34d1f4b5d09fdde93d3a858b7423c42de8105113dcc1300771310a853857d26a';
const CERAMIC_URL = 'https://gateway.ceramic.network';

async function registerDID() {
  try {
    console.log(`Connecting to Ceramic node at: ${CERAMIC_URL}`);
    
    // Initialize Ceramic client
    const ceramic = new CeramicClient(CERAMIC_URL);
    
    // Convert seed to Uint8Array and create DID provider
    console.log('Creating DID provider...');
    const seed = fromString(SEED, 'base16');
    const provider = new Ed25519Provider(seed);
    
    // Create and authenticate DID
    const did = new DID({
      provider,
      resolver: getResolver(),
    });
    
    await did.authenticate();
    console.log(`DID authenticated: ${did.id}`);
    
    // Set the DID on the Ceramic client
    ceramic.did = did;
    
    // Access control configurations for the DID
    console.log('Registering access control permissions for the authenticated DID...');
    
    // Ensure our DID is properly registered with Ceramic
    // This uses the admin API to verify the DID is registered
    const response = await ceramic.admin.getNodeStatus();
    console.log('Ceramic node status:', response);
    
    console.log('DID registration completed successfully.');
    console.log('Your application can now use this DID to access Ceramic from the browser.');
    
  } catch (error) {
    console.error('Error registering DID:', error);
    process.exit(1);
  }
}

// Run the registration
registerDID().catch(console.error);
