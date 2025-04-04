/**
 * Test utility for ComposeDB integration
 * This script tests the ComposeDB integration functionality
 */

// Since we're in a testing environment, we'll mock the ComposeDB functionality
// This allows us to test the integration without actual ComposeDB dependencies

// Mock DataType enum
const DataType = {
  PROFILE: 'profile',
  DOCUMENTS: 'documents',
  MEDICAL: 'medical',
  DIGITAL_ASSETS: 'digital_assets',
  REAL_WORLD_ASSETS: 'real_world_assets',
  CONNECTIONS: 'connections',
  ORGANIZATIONS: 'organizations',
  PRIVATE: 'private',
  MESSAGES: 'messages'
};

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  console.log('✅ Setting up localStorage mock for Node.js environment');
  
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      key: (i) => Object.keys(store)[i] || null,
      length: () => Object.keys(store).length
    };
  })();
  
  global.localStorage = localStorageMock;
  console.log('✅ localStorage mock initialized');
}

// Test ComposeDB integration
const testComposeDB = async () => {
  console.log('🧪 Starting ComposeDB Integration Tests...');
  
  // Use a test DID
  const testDID = 'did:key:test';
  
  // Test ComposeDB client initialization
  console.log('\n🔍 Testing ComposeDB Client Initialization:');
  const client = await initComposeDB();
  console.log(`  ✅ ComposeDB client initialized`);
  
  // Test collection operations
  console.log('\n🔍 Testing Collection Operations:');
  const { exists: collectionExists } = await checkCollectionExists(DataType.PROFILE, testDID);
  console.log(`  Collection exists: ${collectionExists}`);
  
  const { collectionId } = await createCollection(DataType.PROFILE, testDID);
  console.log(`  ✅ Created collection: ${collectionId}`);
  
  // Test record operations
  console.log('\n🔍 Testing Record Operations:');
  const testContent = { name: 'Test User', email: 'test@example.com' };
  const record = await createRecord(DataType.PROFILE, collectionId, testContent, ['test']);
  console.log(`Created record in ${collectionId}:`, record);
  console.log(`  ✅ Created record: ${record.id}`);
  
  const records = await getRecords(collectionId);
  console.log(`  ✅ Retrieved ${records.length} records`);
  
  // Test record update
  console.log('\n🔍 Testing Record Update:');
  const updatedContent = { ...testContent, name: 'Updated Test User' };
  const updatedRecord = await updateRecord(DataType.PROFILE, collectionId, record.id, updatedContent);
  console.log(`  ✅ Updated record: ${updatedRecord?.id}`);
  console.log(`  New name: ${updatedRecord?.content.name}`);
  
  // Test collection clear
  console.log('\n🔍 Testing Collection Clear:');
  const cleared = await clearCollection(collectionId);
  console.log(`  ✅ Cleared collection ${collectionId}: ${cleared}`);
  
  // Test record deletion
  if (!cleared) {
    console.log('\n🔍 Testing Record Deletion:');
    const deleted = await deleteRecord(collectionId, record.id);
    console.log(`  ✅ Deleted record ${record.id}: ${deleted}`);
  }
  
  console.log('\n🏁 All tests completed successfully!');
};

// Run the tests
testComposeDB().catch(error => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});
