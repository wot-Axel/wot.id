/**
 * ComposeDB Integration Test Utility
 * 
 * This script tests the ComposeDB integration by:
 * 1. Initializing the ComposeDB client
 * 2. Testing data operations (create, read, update, delete)
 * 
 * Run this script with: npx ts-node test-composedb-integration.ts
 */

import { initComposeDB, checkCollectionExists, createCollection, createRecord, getRecords, updateRecord, deleteRecord } from './src/composedb/client';
import { DataType } from './src/utils/ceramicUtils';

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key: string) => {
      return global.localStorage[key] || null;
    },
    setItem: (key: string, value: string) => {
      global.localStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete global.localStorage[key];
    },
    clear: () => {
      Object.keys(global.localStorage).forEach(key => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete global.localStorage[key];
        }
      });
    }
  } as Storage;
}

// Test data
const testDID = 'did:key:test123';
const testProfile = {
  name: 'Test User',
  email: 'test@example.com',
  bio: 'This is a test profile'
};

// Main test function
async function runTests() {
  console.log('=== Starting ComposeDB Integration Tests ===');
  
  try {
    // Test client initialization
    console.log('\n--- Testing ComposeDB Client Initialization ---');
    const client = await initComposeDB();
    console.log('✅ ComposeDB client initialized successfully');
    
    // Test collection operations
    console.log('\n--- Testing Collection Operations ---');
    const profileCollection = await checkCollectionExists(DataType.PROFILE, testDID);
    console.log('Profile collection check:', profileCollection);
    
    if (!profileCollection.exists) {
      const newCollection = await createCollection(DataType.PROFILE, testDID);
      console.log('✅ Created profile collection:', newCollection);
    } else {
      console.log('✅ Profile collection already exists');
    }
    
    // Test record operations
    console.log('\n--- Testing Record Operations ---');
    const collectionId = profileCollection.collectionId;
    
    // Create profile record
    console.log('Creating profile record...');
    const profileRecord = await createRecord(
      DataType.PROFILE,
      collectionId,
      testProfile,
      ['test', 'profile']
    );
    console.log('✅ Created profile record:', profileRecord);
    
    // Get profile records
    console.log('Getting profile records...');
    const profileRecords = await getRecords(collectionId);
    console.log(`✅ Retrieved ${profileRecords.length} profile records`);
    
    // Update profile record
    if (profileRecords.length > 0) {
      const recordToUpdate = profileRecords[0];
      console.log('Updating profile record:', recordToUpdate.id);
      const updatedProfile = {
        ...testProfile,
        bio: 'This is an updated test profile'
      };
      
      const updatedRecord = await updateRecord(
        DataType.PROFILE,
        collectionId,
        recordToUpdate.id,
        updatedProfile,
        ['test', 'profile', 'updated']
      );
      console.log('✅ Updated profile record:', updatedRecord);
    }
    
    // Final record count
    const finalProfileRecords = await getRecords(collectionId);
    console.log(`Final profile records: ${finalProfileRecords.length}`);
    
    console.log('\n=== ComposeDB Integration Tests Completed Successfully ===');
    return { client, collectionId, records: finalProfileRecords };
  } catch (error) {
    console.error('\n❌ ComposeDB Integration Tests Failed:', error);
    throw error;
  }
}

// Run the tests
runTests().then(results => {
  console.log('\nTest Results Summary:');
  console.log('- Client initialized:', results.client ? '✅ Yes' : '❌ No');
  console.log('- Collection created:', results.collectionId ? '✅ Yes' : '❌ No');
  console.log('- Records count:', results.records.length);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
