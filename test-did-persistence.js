/**
 * Test DID Persistence
 * This script tests the DID persistence implementation to ensure data is accessible across sessions
 */

// Import required modules
import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

// Constants
const DID_SEED_STORAGE_KEY = 'wot.id-did-seed';
const REMOTE_CERAMIC_NODES = [
  'https://ceramic-clay.3boxlabs.com',
  'https://gateway.ceramic.network',
  'https://ceramic-clay.glazed.dev',
  'https://ceramic.composedb.com'
];

// Helper function to get or create a DID seed
function getPersistentDIDSeed() {
  // For browser environments
  if (typeof localStorage !== 'undefined') {
    const storedSeed = localStorage.getItem(DID_SEED_STORAGE_KEY);
    if (storedSeed) {
      const seedArray = JSON.parse(storedSeed);
      return new Uint8Array(seedArray);
    }
  }
  
  // Generate a new seed
  const seed = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed[i] = Math.floor(Math.random() * 256);
  }
  
  // Store the seed for future use
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DID_SEED_STORAGE_KEY, JSON.stringify(Array.from(seed)));
  }
  
  return seed;
}

// Helper function to get or create a DID
async function getOrCreateDID() {
  // Get the persistent seed
  const seed = getPersistentDIDSeed();
  
  // Create a DID provider and authenticate
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();
  
  return did;
}

// Main function
async function main() {
  try {
    console.log('Testing DID persistence and Ceramic connection...');
    
    // Try to connect to a remote Ceramic node
    let ceramicUrl = null;
    let ceramic = null;
    
    // Try each remote node until one works
    for (const nodeUrl of REMOTE_CERAMIC_NODES) {
      try {
        console.log(`Attempting to connect to Ceramic node at ${nodeUrl}...`);
        const response = await fetch(`${nodeUrl}/api/v0/node/healthcheck`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (!response.ok) {
          console.warn(`Node health check failed for ${nodeUrl}: ${response.status}`);
          continue;
        }
        
        console.log(`Successfully connected to ${nodeUrl}`);
        ceramicUrl = nodeUrl;
        ceramic = new CeramicClient(nodeUrl);
        break;
      } catch (error) {
        console.warn(`Failed to connect to ${nodeUrl}:`, error.message);
      }
    }
    
    if (!ceramic) {
      throw new Error('Failed to connect to any Ceramic node');
    }
    
    // Get or create a DID
    const did = await getOrCreateDID();
    console.log('DID created/retrieved:', did.id);
    
    // Set the DID on the Ceramic client
    ceramic.did = did;
    
    // Create a test document
    console.log('Creating test document...');
    const testDoc = await TileDocument.create(
      ceramic,
      { 
        test: 'persistence-test', 
        timestamp: new Date().toISOString(),
        message: 'This document tests DID persistence'
      },
      { 
        controllers: [did.id], 
        family: 'wot.id-persistence-test' 
      }
    );
    
    console.log('Successfully created test document with ID:', testDoc.id.toString());
    console.log('Document content:', testDoc.content);
    
    console.log('Test completed successfully!');
    console.log('Run this script again to verify that the same DID is used across sessions');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main();
