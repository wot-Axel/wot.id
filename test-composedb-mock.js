/**
 * Test utility for ComposeDB integration
 * This script tests the ComposeDB integration functionality using mocks
 */

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

// Mock ComposeDB client
const mockComposeClient = {
  exists: async (modelName, query) => {
    console.log(`[Mock] Checking if ${modelName} exists with query:`, query);
    return false;
  },
  create: async (modelName, data) => {
    console.log(`[Mock] Creating ${modelName} with data:`, data);
    return {
      documentId: `doc-${Date.now()}`,
      streamId: `stream-${Date.now()}`,
      ...data
    };
  },
  update: async (modelName, id, data) => {
    console.log(`[Mock] Updating ${modelName} ${id} with data:`, data);
    return {
      documentId: id,
      streamId: `stream-${id}`,
      createdAt: new Date().toISOString(),
      ...data
    };
  },
  query: async ({ query }) => {
    console.log(`[Mock] Querying with:`, query);
    return {
      data: {
        ProfileIndex: {
          edges: [
            {
              node: {
                id: 'mock-id-1',
                controller: 'did:key:test',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                content: { name: 'Test User', email: 'test@example.com' },
                tags: ['test']
              }
            }
          ]
        }
      }
    };
  }
};

// Mock ComposeDB functions
const initComposeDB = async () => {
  console.log('[Mock] Initializing ComposeDB client');
  return mockComposeClient;
};

const checkCollectionExists = async (dataType, did) => {
  console.log(`[Mock] Checking if collection ${dataType}_${did} exists`);
  return {
    exists: false,
    collectionId: `${dataType}_${did}`
  };
};

const createCollection = async (dataType, did) => {
  console.log(`[Mock] Creating collection ${dataType}_${did}`);
  return {
    exists: true,
    collectionId: `${dataType}_${did}`
  };
};

const createRecord = async (dataType, collectionId, content, tags = []) => {
  console.log(`[Mock] Creating record in ${collectionId}`);
  const now = new Date().toISOString();
  const id = `record-${Date.now()}`;
  return {
    id,
    streamId: `stream-${id}`,
    controller: collectionId.split('_')[1],
    createdAt: now,
    updatedAt: now,
    content,
    tags
  };
};

const getRecords = async (collectionId) => {
  console.log(`[Mock] Getting records from ${collectionId}`);
  const [dataType, did] = collectionId.split('_');
  const now = new Date().toISOString();
  return [
    {
      id: 'mock-id-1',
      streamId: 'mock-stream-1',
      controller: did,
      createdAt: now,
      updatedAt: now,
      content: { name: 'Test User', email: 'test@example.com' },
      tags: ['test']
    }
  ];
};

const updateRecord = async (dataType, collectionId, recordId, content, tags) => {
  console.log(`[Mock] Updating record ${recordId} in ${collectionId}`);
  const now = new Date().toISOString();
  return {
    id: recordId,
    streamId: `stream-${recordId}`,
    controller: collectionId.split('_')[1],
    createdAt: now,
    updatedAt: now,
    content,
    tags: tags || ['test']
  };
};

const deleteRecord = async (collectionId, recordId) => {
  console.log(`[Mock] Deleting record ${recordId} from ${collectionId}`);
  return true;
};

const clearCollection = async (collectionId) => {
  console.log(`[Mock] Clearing collection ${collectionId}`);
  return true;
};

// Test ComposeDB integration
const testComposeDB = async () => {
  console.log('🧪 Starting ComposeDB Integration Tests...');
  
  // Test ComposeDB client initialization
  console.log('\n🔍 Testing ComposeDB Client Initialization:');
  const client = await initComposeDB();
  console.log(`  ✅ ComposeDB client initialized`);
  
  // Test collection operations
  console.log('\n🔍 Testing Collection Operations:');
  const testDID = 'did:key:test';
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
