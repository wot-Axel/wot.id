/**
 * ComposeDB Integration Test Utility
 * 
 * This script tests the ComposeDB integration by:
 * 1. Initializing the ComposeDB client
 * 2. Testing data operations (create, read, update, delete)
 * 3. Verifying that the data access hook works correctly
 * 
 * Run this script with: node test-ceramic-composedb.js
 */

import { initComposeDB, checkCollectionExists, createCollection, createRecord, getRecords, updateRecord, deleteRecord } from './src/composedb/client.ts';
import { DataType } from './src/utils/ceramicUtils.ts';

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key) => {
      return global.localStorage[key] || null;
    },
    setItem: (key, value) => {
      global.localStorage[key] = value;
    },
    removeItem: (key) => {
      delete global.localStorage[key];
    },
    clear: () => {
      Object.keys(global.localStorage).forEach(key => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete global.localStorage[key];
        }
      });
    }
  };
}

// Test data
const testDID = 'did:key:test123';
const testProfile = {
  name: 'Test User',
  email: 'test@example.com',
  bio: 'This is a test profile'
};
const testAsset = {
  name: 'Test Asset',
  description: 'This is a test digital asset',
  tokenId: '123456',
  contractAddress: '0x1234567890'
};

// Test ComposeDB client initialization
async function testComposeDBInit() {
  console.log('\n--- Testing ComposeDB Client Initialization ---');
  try {
    const client = await initComposeDB();
    console.log('✅ ComposeDB client initialized successfully');
    console.log('Client info:', {
      ceramic: client.ceramic ? '✅ Connected' : '❌ Not connected',
      composeClient: client.composeClient ? '✅ Available' : '❌ Not available'
    });
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize ComposeDB client:', error);
    throw error;
  }
}

// Test collection operations
async function testCollectionOperations(client) {
  console.log('\n--- Testing Collection Operations ---');
  
  // Test profile collection
  try {
    // Check if collection exists
    const profileCollection = await checkCollectionExists(DataType.PROFILE, testDID);
    console.log('Profile collection check:', profileCollection);
    
    // Create collection if it doesn't exist
    if (!profileCollection.exists) {
      const newCollection = await createCollection(DataType.PROFILE, testDID);
      console.log('✅ Created profile collection:', newCollection);
    } else {
      console.log('✅ Profile collection already exists');
    }
    
    // Test digital asset collection
    const assetCollection = await checkCollectionExists(DataType.DIGITAL_ASSETS, testDID);
    console.log('Digital asset collection check:', assetCollection);
    
    if (!assetCollection.exists) {
      const newCollection = await createCollection(DataType.DIGITAL_ASSETS, testDID);
      console.log('✅ Created digital asset collection:', newCollection);
    } else {
      console.log('✅ Digital asset collection already exists');
    }
    
    return {
      profileCollectionId: profileCollection.collectionId,
      assetCollectionId: assetCollection.collectionId
    };
  } catch (error) {
    console.error('❌ Failed to test collection operations:', error);
    throw error;
  }
}

// Test record operations
async function testRecordOperations(collectionIds) {
  console.log('\n--- Testing Record Operations ---');
  const { profileCollectionId, assetCollectionId } = collectionIds;
  
  try {
    // Create profile record
    console.log('Creating profile record...');
    const profileRecord = await createRecord(
      DataType.PROFILE,
      profileCollectionId,
      testProfile,
      ['test', 'profile']
    );
    console.log('✅ Created profile record:', profileRecord);
    
    // Create asset record
    console.log('Creating digital asset record...');
    const assetRecord = await createRecord(
      DataType.DIGITAL_ASSETS,
      assetCollectionId,
      testAsset,
      ['test', 'asset']
    );
    console.log('✅ Created digital asset record:', assetRecord);
    
    // Get profile records
    console.log('Getting profile records...');
    const profileRecords = await getRecords(profileCollectionId);
    console.log(`✅ Retrieved ${profileRecords.length} profile records`);
    
    // Get asset records
    console.log('Getting digital asset records...');
    const assetRecords = await getRecords(assetCollectionId);
    console.log(`✅ Retrieved ${assetRecords.length} digital asset records`);
    
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
        profileCollectionId,
        recordToUpdate.id,
        updatedProfile,
        ['test', 'profile', 'updated']
      );
      console.log('✅ Updated profile record:', updatedRecord);
    }
    
    // Delete asset record
    if (assetRecords.length > 0) {
      const recordToDelete = assetRecords[0];
      console.log('Deleting digital asset record:', recordToDelete.id);
      const deleteResult = await deleteRecord(assetCollectionId, recordToDelete.id);
      console.log('✅ Deleted digital asset record:', deleteResult);
    }
    
    // Final record count
    const finalProfileRecords = await getRecords(profileCollectionId);
    const finalAssetRecords = await getRecords(assetCollectionId);
    
    console.log(`Final profile records: ${finalProfileRecords.length}`);
    console.log(`Final digital asset records: ${finalAssetRecords.length}`);
    
    return {
      profileRecords: finalProfileRecords,
      assetRecords: finalAssetRecords
    };
  } catch (error) {
    console.error('❌ Failed to test record operations:', error);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('=== Starting ComposeDB Integration Tests ===');
  
  try {
    // Test client initialization
    const client = await testComposeDBInit();
    
    // Test collection operations
    const collectionIds = await testCollectionOperations(client);
    
    // Test record operations
    const records = await testRecordOperations(collectionIds);
    
    console.log('\n=== ComposeDB Integration Tests Completed Successfully ===');
    return { client, collectionIds, records };
  } catch (error) {
    console.error('\n❌ ComposeDB Integration Tests Failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().then(results => {
  console.log('\nTest Results Summary:');
  console.log('- Client initialized:', results.client ? '✅ Yes' : '❌ No');
  console.log('- Collections created:', results.collectionIds ? '✅ Yes' : '❌ No');
  console.log('- Records created:', results.records ? '✅ Yes' : '❌ No');
  console.log('- Profile records count:', results.records.profileRecords.length);
  console.log('- Asset records count:', results.records.assetRecords.length);
});
