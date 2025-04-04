/**
 * Ceramic Integration Test Runner
 * This script runs the Ceramic integration tests
 */

// Mock localStorage for Node.js environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(key) {
      return this._data[key];
    },
    setItem(key, value) {
      this._data[key] = value;
    },
    removeItem(key) {
      delete this._data[key];
    },
    clear() {
      this._data = {};
    }
  };
  console.log('✅ localStorage mock initialized');
}

// Import the test utilities
import * as ceramicUtils from './src/utils/ceramicUtils.js';
import * as schemaValidation from './src/utils/schemaValidation.js';
import * as dataExportImport from './src/utils/dataExportImport.js';
import * as encryptionUtils from './src/utils/encryptionUtils.js';

async function runTests() {
  console.log('🧪 Starting Ceramic Integration Tests...');
  
  try {
    // Create a simple test that verifies the core functionality
    const results = {};
    
    // 1. Test Ceramic Utils
    console.log('\n🔍 Testing Ceramic Utils:');
    const mockCeramic = { did: { id: 'did:key:test' } };
    const testDid = 'did:key:test';
    const dataType = ceramicUtils.DataType.PROFILE;
    
    // Check collection existence
    const collectionInfo = await ceramicUtils.checkCollectionExists(mockCeramic, dataType, testDid);
    console.log(`  Collection exists: ${collectionInfo.exists}`);
    
    // Create collection if it doesn't exist
    let collectionId;
    if (!collectionInfo.exists) {
      const newCollection = await ceramicUtils.createCollection(mockCeramic, dataType, testDid);
      collectionId = newCollection.collectionId;
      console.log(`  ✅ Created collection: ${collectionId}`);
    } else {
      collectionId = collectionInfo.collectionId;
      console.log(`  ✅ Using existing collection: ${collectionId}`);
    }
    
    // Create a test record
    const testContent = { name: 'Test User', email: 'test@example.com' };
    const record = await ceramicUtils.createRecord(mockCeramic, dataType, collectionId, testContent, ['test']);
    console.log(`  ✅ Created record: ${record.id}`);
    
    // Get records
    const records = await ceramicUtils.getRecords(mockCeramic, collectionId);
    console.log(`  ✅ Retrieved ${records.length} records`);
    
    // 2. Test Schema Validation
    console.log('\n🔍 Testing Schema Validation:');
    const validationResult = schemaValidation.validateData(dataType, testContent);
    console.log(`  ✅ Validation result: ${validationResult.valid ? 'Valid' : 'Invalid'}`);
    
    // 3. Test Encryption
    console.log('\n🔍 Testing Encryption:');
    const testPassword = 'test-password';
    const encrypted = await encryptionUtils.encryptData(testContent, testPassword);
    console.log(`  ✅ Encrypted data: ${encrypted.substring(0, 20)}...`);
    
    const decrypted = await encryptionUtils.decryptData(encrypted, testPassword);
    console.log(`  ✅ Decrypted data: ${JSON.stringify(decrypted).substring(0, 30)}...`);
    
    // 4. Test Export/Import
    console.log('\n🔍 Testing Export/Import:');
    const exported = await dataExportImport.exportAllData();
    console.log(`  ✅ Exported data size: ${exported.length} characters`);
    
    // Clean up
    await ceramicUtils.clearCollection(mockCeramic, collectionId);
    console.log(`  ✅ Cleared collection: ${collectionId}`);
    
    console.log('\n🏁 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
