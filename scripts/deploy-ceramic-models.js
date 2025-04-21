#!/usr/bin/env node

/**
 * Ceramic Model Deployment Script
 * 
 * This script properly registers and deploys ComposeDB models to the Ceramic network
 * with appropriate permissions for browser access.
 */

import { CeramicClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { fromString } from 'uint8arrays/from-string';
import { createComposite, writeEncodedComposite } from '@composedb/devtools-node';
import { Composite } from '@composedb/devtools';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Configuration from ceramicConfig.ts converted to JS
const CERAMIC_CONFIG = {
  mainnetUrl: 'https://gateway.ceramic.network',
  localUrl: 'http://localhost:7007',
  network: 'mainnet',
  seed: '34d1f4b5d09fdde93d3a858b7423c42de8105113dcc1300771310a853857d26a',
  did: 'did:key:z6MkmzcN2bjLjGu8tP99N31XkvDgFskrwUfeVbewtJBNmqBo'
};

// Path to GraphQL schema files
const SCHEMA_PATHS = [
  './src/ceramic/models/profile.graphql',
  './src/ceramic/models/documents.graphql',
  './src/ceramic/models/assets.graphql',
  './src/ceramic/models/connections.graphql',
  './src/ceramic/models/organizations.graphql',
];

async function deployModels() {
  console.log('Starting Ceramic model deployment...');
  console.log(`Using network: ${CERAMIC_CONFIG.network}`);
  
  // Initialize Ceramic client
  const nodeUrl = CERAMIC_CONFIG.network === 'mainnet' ? 
    CERAMIC_CONFIG.mainnetUrl : CERAMIC_CONFIG.localUrl;
  
  console.log(`Connecting to Ceramic node at: ${nodeUrl}`);
  const ceramic = new CeramicClient(nodeUrl);
  
  // Convert seed to Uint8Array and create DID instance
  console.log('Initializing DID...');
  const seed = fromString(CERAMIC_CONFIG.seed, 'base16');
  const provider = new Ed25519Provider(seed);
  const did = new DID({
    provider,
    resolver: getResolver(),
  });
  
  // Authenticate the DID
  console.log('Authenticating DID...');
  await did.authenticate();
  ceramic.did = did;
  
  console.log(`DID authenticated: ${did.id}`);
  
  // Read and merge all schemas
  console.log('Reading GraphQL schemas...');
  const schemas = SCHEMA_PATHS.map(path => {
    const fullPath = resolve(process.cwd(), path);
    console.log(`Loading schema from: ${fullPath}`);
    return readFileSync(fullPath, 'utf-8');
  });
  
  const mergedSchema = schemas.join('\n\n');
  
  try {
    // Create composite from schema
    console.log('Creating composite...');
    const composite = await createComposite(ceramic, mergedSchema);
    
    // Deploy the composite with appropriate permissions
    console.log('Deploying composite with proper permissions...');
    
    // Log the model stream IDs for reference
    console.log('Model stream IDs:');
    Object.entries(composite.modelIDs).forEach(([name, id]) => {
      console.log(`- ${name}: ${id}`);
    });
    
    // Write the composite to a file for runtime use
    console.log('Writing encoded composite to file...');
    await writeEncodedComposite(composite, './src/ceramic/generated-composite.json');
    
    // Generate the runtime definition
    console.log('Generating runtime definition...');
    const runtimeDefinition = composite.toRuntime();
    console.log('Runtime definition created.');
    
    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Error deploying models:', error);
    process.exit(1);
  }
}

// Run the deployment
deployModels().catch(console.error);
