/**
 * Ceramic utility functions for interacting with the Ceramic network
 * Implements a robust connection strategy with multi-node fallback
 */

import { monitorAsync } from './performanceMonitor';
import { validateData } from './schemaValidation';
import { connectToCeramic, resetFailedNodes, getConnectionStatus } from './ceramicConnector';

// Import types from our consolidated ceramic.ts file
import { 
  CeramicClient,
  ContentRecord,
  CollectionInfo,
  DataType
} from '../composedb/ceramic';
import { createDIDFromId } from '../composedb/did-helper';

// Define CeramicDID for backward compatibility
export interface CeramicDID {
  id: string;
}

/**
 * Initialize Ceramic client with multi-node fallback strategy
 * @param identity Optional user identity for deterministic DID generation
 * @returns Initialized Ceramic client
 */
export const initCeramic = async (identity?: string): Promise<any> => {
  return monitorAsync('initCeramic', 'ceramicUtils', async () => {
    // Try to connect using our robust connection strategy
    const ceramic = await connectToCeramic(identity);
    
    if (!ceramic) {
      console.error('Failed to connect to any Ceramic node. Using fallback local implementation.');
      // Return a minimal client for offline functionality
      return {
        did: createDIDFromId('did:key:placeholder'),
        isOffline: true
      };
    }
    
    return ceramic;
  });
};

/**
 * Reset failed nodes to retry previously failed connections
 */
export const resetCeramicNodes = (): void => {
  resetFailedNodes();
  console.log('Reset failed Ceramic nodes. Will retry on next connection attempt.');
};

/**
 * Get current Ceramic connection status
 * @returns Connection status information
 */
export const getCeramicStatus = (): {
  lastSuccessfulNode: string | null;
  failedNodes: string[];
} => {
  return getConnectionStatus();
};

// Ensure window.ethereum is recognized
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

// Interface for data records - compatible with previous implementation
export interface TableData {
  id: number;
  key: string;      // This maps to item_key in the database
  value: string;    // This maps to item_value in the database
  created_at: string;
}

// Alias for TableData to maintain compatibility with existing code
export type PrivateData = TableData;

// Re-export DataType from our consolidated ceramic.ts file
export { DataType };

// CeramicDID is already defined above

// Re-export types from ceramic-exports
export type { CeramicClient };

// Database type for backward compatibility
export type Database = CeramicClient;

// Re-export types from ceramic-exports
export type { ContentRecord };

// Re-export types from ceramic-exports
export type { CollectionInfo };

// DataType is already re-exported above

// Storage key for localStorage
const CERAMIC_STORAGE_KEY = 'ceramic_local_storage';

/**
 * Get the storage from localStorage
 * @returns The storage object
 */
const getStorage = (): Record<string, ContentRecord[]> => {
  try {
    const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
    return storageStr ? JSON.parse(storageStr) : {};
  } catch (error) {
    console.error('Error getting storage:', error);
    return {};
  }
};

/**
 * Save the storage to localStorage
 * @param storage The storage object to save
 */
const saveStorage = (storage: Record<string, ContentRecord[]>): void => {
  try {
    localStorage.setItem(CERAMIC_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Error saving storage:', error);
  }
};

/**
 * Clear all collections from storage
 */
export const clearAllCollections = (): void => {
  try {
    localStorage.removeItem(CERAMIC_STORAGE_KEY);
    console.log('All collections cleared');
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
};

/**
 * Check if a collection exists for a specific data type and DID
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const checkCollectionExists = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<CollectionInfo> => {
  return monitorAsync('checkCollectionExists', 'ceramicUtils', async () => {
    const collectionId = `${dataType}_${did}`;
    const storage = getStorage();
    const exists = !!storage[collectionId];
    
    return { exists, collectionId };
  });
};

/**
 * Create a new collection for a specific data type and DID
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const createCollection = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<CollectionInfo> => {
  return monitorAsync('createCollection', 'ceramicUtils', async () => {
    const collectionId = `${dataType}_${did}`;
    const storage = getStorage();
    
    // Initialize the collection if it doesn't exist
    if (!storage[collectionId]) {
      storage[collectionId] = [];
      saveStorage(storage);
    }
    
    return { exists: true, collectionId };
  });
};

/**
 * Create a new record in a collection
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param content The content of the record
 * @param tags Optional tags for the record
 * @returns The created record
 */
export const createRecord = async (
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string,
  content: any,
  tags: string[] = []
): Promise<ContentRecord> => {
  return monitorAsync('createRecord', 'ceramicUtils', async () => {
    // Validate the data before storing it
    const validationResult = validateData(dataType, content);
    if (!validationResult.valid) {
      console.warn(`Data validation failed for ${collectionId}:`, validationResult.errors);
      // Continue anyway for now, but log the validation errors
      // In the future, this could throw an error to prevent invalid data from being stored
    }
    
    // Get the storage
    const storage = getStorage();
    
    // Initialize the collection if it doesn't exist
    if (!storage[collectionId]) {
      storage[collectionId] = [];
    }
    
    const timestamp = new Date().toISOString();
    const did = ceramic.did?.id || 'unknown';
    
    // Create a new record
    const record: ContentRecord = {
      id: Math.random().toString(36).substring(2, 15),
      streamId: Math.random().toString(36).substring(2, 15),
      controller: did,
      createdAt: timestamp,
      updatedAt: timestamp,
      content,
      tags
    };
    
    // Add the record to the collection
    storage[collectionId].push(record);
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Created record in ${collectionId}:`, record);
    return record;
  });
};

/**
 * Get all records from a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection
 * @returns Array of records
 */
export const getRecords = async (
  ceramic: CeramicClient,
  collectionId: string
): Promise<ContentRecord[]> => {
  return monitorAsync('getRecords', 'ceramicUtils', async () => {
    const storage = getStorage();
    return storage[collectionId] || [];
  });
};

/**
 * Update a record in a collection
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to update
 * @param content The new content of the record
 * @param tags Optional new tags for the record
 * @returns The updated record or null if not found
 */
export const updateRecord = async (
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string,
  recordId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord | null> => {
  return monitorAsync('updateRecord', 'ceramicUtils', async () => {
    // Validate the data before updating
    const validationResult = validateData(dataType, content);
    if (!validationResult.valid) {
      console.warn(`Data validation failed for ${collectionId}:`, validationResult.errors);
      // Continue anyway for now, but log the validation errors
    }
    
    const storage = getStorage();
    if (!storage[collectionId]) {
      return null;
    }
    
    const recordIndex = storage[collectionId].findIndex(record => record.id === recordId);
    if (recordIndex === -1) {
      return null;
    }
    
    const timestamp = new Date().toISOString();
    const record = storage[collectionId][recordIndex];
    
    // Update the record
    const updatedRecord: ContentRecord = {
      ...record,
      updatedAt: timestamp,
      content,
      ...(tags && { tags })
    };
    
    // Replace the record in the collection
    storage[collectionId][recordIndex] = updatedRecord;
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Updated record in ${collectionId}:`, updatedRecord);
    return updatedRecord;
  });
};

/**
 * Delete a record from a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to delete
 * @returns Whether the record was deleted
 */
export const deleteRecord = async (
  ceramic: CeramicClient,
  collectionId: string,
  recordId: string
): Promise<boolean> => {
  return monitorAsync('deleteRecord', 'ceramicUtils', async () => {
    const storage = getStorage();
    if (!storage[collectionId]) {
      return false;
    }
    
    const recordIndex = storage[collectionId].findIndex(record => record.id === recordId);
    if (recordIndex === -1) {
      return false;
    }
    
    // Remove the record from the collection
    storage[collectionId].splice(recordIndex, 1);
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Deleted record ${recordId} from ${collectionId}`);
    return true;
  });
};

/**
 * Clear a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection to clear
 * @returns Whether the collection was cleared
 */
export const clearCollection = async (
  ceramic: CeramicClient,
  collectionId: string
): Promise<boolean> => {
  return monitorAsync('clearCollection', 'ceramicUtils', async () => {
    const storage = getStorage();
    if (!storage[collectionId]) {
      return false;
    }
    
    // Clear the collection
    storage[collectionId] = [];
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Cleared collection ${collectionId}`);
    return true;
  });
};
