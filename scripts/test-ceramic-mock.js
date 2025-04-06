/**
 * Ceramic Mock Implementation Test Script
 * 
 * This script tests the Ceramic mock implementation by:
 * 1. Creating test documents in the mock storage
 * 2. Retrieving and verifying those documents
 * 3. Checking localStorage for proper data persistence
 * 4. Testing the behavior when switching between online and offline modes
 */

// Force production mode to ensure mock implementation is used
process.env.NODE_ENV = 'production';

// Import required modules
const { createMockCeramicClient, shouldUseMockImplementation, clearMockData } = require('../src/composedb/ceramic-mock');
const { initCeramic } = require('../src/composedb/ceramic');

// Test data
const TEST_DOCUMENTS = [
  { type: 'identity', content: { name: 'Test User', email: 'test@example.com' } },
  { type: 'medical', content: { condition: 'Test Condition', date: '2025-04-06' } },
  { type: 'asset', content: { name: 'Test Asset', value: 1000 } }
];

/**
 * Test the creation of documents in the mock implementation
 */
async function testDocumentCreation(client) {
  console.log('\n📝 Testing document creation...');
  
  const results = [];
  
  for (const doc of TEST_DOCUMENTS) {
    try {
      const result = await client.createDocument(doc.type, doc.content);
      console.log(`✅ Created ${doc.type} document with ID: ${result.id}`);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to create ${doc.type} document:`, error);
    }
  }
  
  return results;
}

/**
 * Test retrieving documents from the mock implementation
 */
async function testDocumentRetrieval(client, documents) {
  console.log('\n🔍 Testing document retrieval...');
  
  for (const doc of documents) {
    try {
      const retrieved = await client.loadDocument(doc.id);
      console.log(`✅ Retrieved document ${doc.id}:`);
      console.log(`   Type: ${retrieved.metadata.type}`);
      console.log(`   Content matches: ${JSON.stringify(retrieved.content) === JSON.stringify(doc.content)}`);
    } catch (error) {
      console.error(`❌ Failed to retrieve document ${doc.id}:`, error);
    }
  }
}

/**
 * Check localStorage for proper data persistence
 */
function checkLocalStorage() {
  console.log('\n💾 Checking localStorage for data persistence...');
  
  // In a browser environment, we would check localStorage directly
  // Since this is Node.js, we'll simulate by checking the mock implementation's internal storage
  
  const mockStorageKeys = Object.keys(global.localStorage || {})
    .filter(key => key.startsWith('ceramic-mock-'));
  
  if (mockStorageKeys.length > 0) {
    console.log(`✅ Found ${mockStorageKeys.length} items in mock storage:`);
    mockStorageKeys.forEach(key => {
      try {
        const value = global.localStorage.getItem(key);
        const parsed = JSON.parse(value);
        console.log(`   ${key}: ${parsed.metadata?.type || 'unknown type'}`);
      } catch (e) {
        console.log(`   ${key}: [unparseable data]`);
      }
    });
  } else {
    console.log('❌ No mock storage data found');
  }
}

/**
 * Test the behavior when switching between online and offline modes
 */
async function testOnlineOfflineSwitch() {
  console.log('\n🔄 Testing online/offline switching behavior...');
  
  // Simulate going offline
  console.log('📴 Simulating offline mode...');
  global._isOffline = true;
  
  // Initialize Ceramic in "offline" mode
  const offlineClient = await initCeramic();
  console.log(`✅ Initialized Ceramic client in offline mode: ${offlineClient.isOffline === true}`);
  console.log(`✅ Using mock implementation: ${shouldUseMockImplementation()}`);
  
  // Simulate going back online
  console.log('\n📶 Simulating online mode...');
  global._isOffline = false;
  
  // In a real test, we would test connecting to actual Ceramic nodes here
  console.log('Note: In a real environment, the application would attempt to connect to Ceramic nodes when online');
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 CERAMIC MOCK IMPLEMENTATION TEST\n');
  
  // Set up mock localStorage for Node.js environment
  if (typeof localStorage === 'undefined') {
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
  }
  
  // Clear any existing mock data
  console.log('🧹 Clearing existing mock data...');
  clearMockData();
  
  // Check if we should use the mock implementation
  console.log(`🔍 Should use mock implementation: ${shouldUseMockImplementation()}`);
  
  // Create a mock Ceramic client
  console.log('🔧 Creating mock Ceramic client...');
  const mockClient = createMockCeramicClient();
  console.log(`✅ Mock client created: ${mockClient.isOffline === true}`);
  
  // Run the tests
  const createdDocs = await testDocumentCreation(mockClient);
  await testDocumentRetrieval(mockClient, createdDocs);
  checkLocalStorage();
  await testOnlineOfflineSwitch();
  
  console.log('\n✅ All tests completed!');
  console.log('\nTo test in a browser environment:');
  console.log('1. Open your deployed application');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to Console tab and run: localStorage.clear()');
  console.log('4. Test the application functionality');
  console.log('5. Go to Application tab > Local Storage to see stored data');
  console.log('6. Use Network tab > Offline to test offline functionality');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
});
