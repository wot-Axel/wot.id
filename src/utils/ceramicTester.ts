/**
 * Ceramic integration test utility
 * This provides a simple way to test the Ceramic integration
 */

import {
  DataType,
  CeramicClient,
  checkCollectionExists,
  createCollection,
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  clearCollection,
  initCeramic
} from '../composedb/ceramic';
import { createDIDFromId } from '../composedb/did-helper';
import { validateData } from './schemaValidation';
import { exportAllData, importData } from './dataExportImport';
import { encryptData, decryptData } from './encryptionUtils';
import { monitorAsync } from './performanceMonitor';

// Initialize a real Ceramic client for testing
// This will be properly initialized with a DID when used
let mockCeramic: CeramicClient;

// Create a mock Ceramic client with a proper DID
const createMockCeramicWithDID = (): CeramicClient => {
  return {
    did: createDIDFromId('did:key:test'),
    isOffline: true
  } as CeramicClient;
};

// Initialize the Ceramic client
const initMockCeramic = async () => {
  if (!mockCeramic) {
    try {
      mockCeramic = await initCeramic();
      // Ensure the client has a valid DID
      if (!mockCeramic.did) {
        mockCeramic.did = createDIDFromId('did:key:test');
      }
    } catch (error) {
      console.error('Failed to initialize Ceramic client:', error);
      // Use our mock client with a proper DID
      mockCeramic = createMockCeramicWithDID();
    }
  }
  return mockCeramic;
};

// Test data for each data type
const testData = {
  [DataType.PROFILE]: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  [DataType.DOCUMENTS]: {
    passport: 'AB123456',
    nationalId: 'ID12345678'
  },
  [DataType.MEDICAL]: {
    key: 'Blood Type',
    value: 'O+',
    unit: '',
    referenceRange: ''
  },
  [DataType.DIGITAL_ASSETS]: {
    name: 'CryptoPunk #1234',
    type: 'nft',
    platform: 'Ethereum',
    identifier: '1234',
    chainId: '1',
    chainName: 'Ethereum Mainnet',
    contractAddress: '0x1234567890abcdef',
    tokenId: '1234'
  },
  [DataType.REAL_WORLD_ASSETS]: {
    name: 'Family Home',
    type: 'real estate',
    value: '500000',
    location: '123 Main St, Anytown, USA'
  },
  [DataType.CONNECTIONS]: {
    name: 'Jane Smith',
    relationship: 'Friend',
    email: 'jane.smith@example.com',
    phone: '555-123-4567'
  },
  [DataType.MESSAGES]: {
    sender: 'did:key:alice',
    recipient: 'did:key:bob',
    content: 'Hello, how are you?',
    timestamp: new Date().toISOString()
  },
  [DataType.PRIVATE]: {
    key: 'Secret Note',
    value: 'This is a private note',
    created_at: new Date().toISOString()
  },
  [DataType.ORGANIZATIONS]: {
    name: 'Acme Corporation',
    role: 'Software Developer',
    startDate: '2020-01-01',
    endDate: '',
    current: true
  }
};

/**
 * Run a full test of the Ceramic integration
 * @returns Test results
 */
export const runCeramicTest = async () => {
  return monitorAsync('runCeramicTest', 'ceramicTester', async () => {
    const results: Record<string, any> = {};
    const testDid = 'did:key:test';
    
    try {
      console.log('Starting Ceramic integration test...');
      
      // Initialize the Ceramic client
      mockCeramic = await initMockCeramic();
      
      // Test each data type
      for (const dataType of Object.values(DataType)) {
        console.log(`Testing ${dataType}...`);
        
        // Test collection creation
        const { exists: existsBefore, collectionId } = await checkCollectionExists(
          mockCeramic,
          dataType as DataType,
          testDid
        );
        
        results[`${dataType}_existsBefore`] = existsBefore;
        
        if (!existsBefore) {
          await createCollection(mockCeramic, dataType as DataType, testDid);
        }
        
        const { exists: existsAfter } = await checkCollectionExists(
          mockCeramic,
          dataType as DataType,
          testDid
        );
        
        results[`${dataType}_existsAfter`] = existsAfter;
        
        // Test data validation
        const validationResult = validateData(dataType as DataType, testData[dataType as DataType]);
        results[`${dataType}_validation`] = validationResult;
        
        // Test record creation
        const record = await createRecord(
          mockCeramic,
          dataType as DataType,
          collectionId,
          testData[dataType as DataType],
          ['test']
        );
        
        results[`${dataType}_record`] = record;
        
        // Test getting records
        const records = await getRecords(mockCeramic, collectionId);
        results[`${dataType}_records`] = records;
        
        // Test updating a record
        if (records.length > 0) {
          const updatedData = { ...testData[dataType as DataType], updated: true };
          const updatedRecord = await updateRecord(
            mockCeramic,
            dataType as DataType,
            collectionId,
            records[0].id,
            updatedData
          );
          
          results[`${dataType}_updatedRecord`] = updatedRecord;
        }
        
        // Test encryption
        const password = 'test-password';
        const encrypted = await encryptData(testData[dataType as DataType], password);
        const decrypted = await decryptData(encrypted, password);
        
        results[`${dataType}_encryption`] = {
          original: testData[dataType as DataType],
          encrypted: encrypted.substring(0, 20) + '...',
          decrypted
        };
      }
      
      // Test data export/import
      const exportedData = await exportAllData();
      results.exportedData = exportedData.substring(0, 100) + '...';
      
      // Clear all collections before import
      for (const dataType of Object.values(DataType)) {
        const { collectionId } = await checkCollectionExists(
          mockCeramic,
          dataType as DataType,
          testDid
        );
        
        await clearCollection(mockCeramic, collectionId);
      }
      
      // Test import
      const importResult = await importData(exportedData, true);
      results.importResult = importResult;
      
      // Verify import
      for (const dataType of Object.values(DataType)) {
        const { collectionId } = await checkCollectionExists(
          mockCeramic,
          dataType as DataType,
          testDid
        );
        
        const records = await getRecords(mockCeramic, collectionId);
        results[`${dataType}_afterImport`] = records.length;
      }
      
      console.log('Ceramic integration test completed successfully');
      return { success: true, results };
    } catch (error) {
      console.error('Ceramic integration test failed:', error);
      return {
        success: false,
        results: {
          ...results,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
};

/**
 * Run a simple test of the Ceramic integration
 * @returns Test results
 */
export const runSimpleCeramicTest = async () => {
  try {
    const testDid = 'did:key:test';
    const dataType = DataType.PROFILE;
    
    // Initialize the Ceramic client
    mockCeramic = await initMockCeramic();
    
    // Check if collection exists
    const { exists, collectionId } = await checkCollectionExists(
      mockCeramic,
      dataType,
      testDid
    );
    
    // Create collection if it doesn't exist
    if (!exists) {
      await createCollection(mockCeramic, dataType, testDid);
    }
    
    // Create a test record
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    };
    
    const record = await createRecord(
      mockCeramic,
      dataType,
      collectionId,
      testData
    );
    
    // Get records
    const records = await getRecords(mockCeramic, collectionId);
    
    // Clean up
    await clearCollection(mockCeramic, collectionId);
    
    return {
      success: true,
      message: `Test completed successfully. Created record with ID ${record.id}. Found ${records.length} records.`
    };
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
