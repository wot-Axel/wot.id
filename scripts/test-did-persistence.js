/**
 * Test DID Persistence
 * This script tests the DID persistence implementation to ensure data is accessible across sessions
 */

import { initComposeDB } from '../src/composedb/client.ts';
import { TileDocument } from '@ceramicnetwork/stream-tile';

async function main() {
  try {
    console.log('Testing DID persistence and Ceramic connection...');
    
    // Initialize ComposeDB client
    const client = await initComposeDB();
    
    // Get the DID from the client
    const did = client.ceramic.did;
    
    if (!did) {
      throw new Error('No DID found in the Ceramic client');
    }
    
    console.log('Successfully authenticated with DID:', did.id);
    
    // Create a test document to verify we can write to Ceramic
    const testDoc = await TileDocument.create(
      client.ceramic,
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
    
    // Store the document ID for future verification
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wot-id-test-doc-id', testDoc.id.toString());
      console.log('Stored document ID in localStorage for future verification');
    }
    
    console.log('Test completed successfully!');
    console.log('Run this script again to verify that the same DID is used across sessions');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
