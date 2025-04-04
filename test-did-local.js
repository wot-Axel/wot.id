/**
 * Test DID Persistence (Local Only)
 * This script tests the DID persistence implementation without requiring an active Ceramic connection
 */

import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

// Constants
const DID_SEED_STORAGE_KEY = 'wot.id-did-seed';

// Mock localStorage for Node.js environment
const localStorage = {
  _data: {},
  getItem(key) {
    return this._data[key];
  },
  setItem(key, value) {
    this._data[key] = value;
  },
  removeItem(key) {
    delete this._data[key];
  }
};

// Helper function to get or create a DID seed
function getPersistentDIDSeed() {
  // Check if we have a stored seed
  const storedSeed = localStorage.getItem(DID_SEED_STORAGE_KEY);
  if (storedSeed) {
    console.log('Found existing DID seed in storage');
    const seedArray = JSON.parse(storedSeed);
    return new Uint8Array(seedArray);
  }
  
  console.log('Generating new DID seed');
  // Generate a new seed
  const seed = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed[i] = Math.floor(Math.random() * 256);
  }
  
  // Store the seed for future use
  localStorage.setItem(DID_SEED_STORAGE_KEY, JSON.stringify(Array.from(seed)));
  
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
    console.log('Testing DID persistence locally...');
    
    // First run - get or create a DID
    console.log('First DID creation/retrieval:');
    const did1 = await getOrCreateDID();
    console.log('DID created/retrieved:', did1.id);
    
    // Store the DID ID for comparison
    const firstDID = did1.id;
    
    // Second run - should retrieve the same DID
    console.log('\nSecond DID retrieval (should match first):');
    const did2 = await getOrCreateDID();
    console.log('DID retrieved:', did2.id);
    
    // Compare the DIDs
    if (firstDID === did2.id) {
      console.log('\n✅ SUCCESS: DIDs match! DID persistence is working correctly.');
    } else {
      console.log('\n❌ FAILURE: DIDs do not match! DID persistence is not working correctly.');
      console.log(`First DID: ${firstDID}`);
      console.log(`Second DID: ${did2.id}`);
    }
    
    // Clear the seed and test again to verify new seed generation
    console.log('\nTesting with cleared storage:');
    localStorage.removeItem(DID_SEED_STORAGE_KEY);
    
    // Third run - should create a new DID
    const did3 = await getOrCreateDID();
    console.log('New DID created after clearing storage:', did3.id);
    
    if (firstDID !== did3.id) {
      console.log('✅ SUCCESS: New DID is different from original, as expected.');
    } else {
      console.log('❌ FAILURE: New DID is the same as original, which is unexpected.');
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main();
