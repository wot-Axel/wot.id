/**
 * Ceramic Utilities
 * 
 * This file provides utility functions for interacting with the Ceramic network
 * with a robust connection strategy and proper DID persistence.
 */

import { monitorAsync } from '../utils/performanceMonitor';
import { validateData } from '../utils/schemaValidation';
import { 
  connectToCeramic, 
  resetFailedNodes, 
  getConnectionStatus 
} from '../utils/ceramicConnector';

// Define types
import { CeramicClient as CeramicHttpClient } from '@ceramicnetwork/http-client';
import { createDIDFromId } from './did-helper';

// Export interfaces
export interface CeramicDID {
  id: string;
  [key: string]: any;
}

export interface CeramicClient extends CeramicHttpClient {
  isOffline?: boolean;
}

export interface ContentRecord {
  id: string;
  streamId: string;
  controller: string;
  createdAt: string;
  updatedAt: string;
  content: any;
  tags?: string[];
}

export interface CollectionInfo {
  exists: boolean;
  collectionId: string;
}

// Export DataType enum
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  CONNECTIONS = 'connections',  // Changed from RELATIONSHIPS to match models.ts
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}

// Storage key for localStorage
const CERAMIC_STORAGE_KEY = 'ceramic_local_storage';

/**
 * Initialize Ceramic client with multi-node fallback strategy
 * @param identity Optional user identity for deterministic DID generation
 * @returns Initialized Ceramic client
 */
export const initCeramic = async (identity?: string): Promise<CeramicClient> => {
  return monitorAsync('initCeramic', 'ceramicUtils', async () => {
    // Try to connect using our robust connection strategy
    const ceramic = await connectToCeramic(identity);
    
    if (!ceramic) {
      console.error('Failed to connect to any Ceramic node. Using fallback local implementation.');
      // Return a minimal client for offline functionality
      return {
        did: createDIDFromId('did:key:placeholder'),
        isOffline: true
      } as unknown as CeramicClient;
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

/**
 * Get the storage from localStorage
 * @returns The storage object
 */
const getStorage = (): Record<string, ContentRecord[]> => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const storage = localStorage.getItem(CERAMIC_STORAGE_KEY);
    return storage ? JSON.parse(storage) : {};
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
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
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
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(CERAMIC_STORAGE_KEY);
    console.log('Cleared all collections from storage');
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
    if (ceramic.isOffline) {
      // For offline mode, check if the collection exists in localStorage
      const storage = getStorage();
      const collectionId = `${did}:${dataType}`;
      
      return {
        exists: !!storage[collectionId],
        collectionId
      };
    }
    
    // TODO: Implement actual Ceramic network check
    // For now, we'll just return a placeholder
    return {
      exists: false,
      collectionId: `${did}:${dataType}`
    };
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
    if (ceramic.isOffline) {
      // For offline mode, create the collection in localStorage
      const storage = getStorage();
      const collectionId = `${did}:${dataType}`;
      
      if (!storage[collectionId]) {
        storage[collectionId] = [];
        saveStorage(storage);
      }
      
      return {
        exists: true,
        collectionId
      };
    }
    
    // TODO: Implement actual Ceramic network collection creation
    // For now, we'll just return a placeholder
    return {
      exists: true,
      collectionId: `${did}:${dataType}`
    };
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
    // Validate the data against the schema
    const validationResult = validateData(dataType, content);
    if (!validationResult.valid) {
      throw new Error(`Invalid data for ${dataType}: ${validationResult.errors.join(', ')}`);
    }
    
    if (ceramic.isOffline) {
      // For offline mode, create the record in localStorage
      const storage = getStorage();
      
      if (!storage[collectionId]) {
        storage[collectionId] = [];
      }
      
      const now = new Date().toISOString();
      const record: ContentRecord = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        streamId: `stream-${Date.now()}`,
        controller: ceramic.did?.id || 'unknown',
        createdAt: now,
        updatedAt: now,
        content,
        tags
      };
      
      storage[collectionId].push(record);
      saveStorage(storage);
      
      return record;
    }
    
    // TODO: Implement actual Ceramic network record creation
    // For now, we'll just return a placeholder
    const now = new Date().toISOString();
    return {
      id: `ceramic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      streamId: `stream-${Date.now()}`,
      controller: ceramic.did?.id || 'unknown',
      createdAt: now,
      updatedAt: now,
      content,
      tags
    };
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
    if (ceramic.isOffline) {
      // For offline mode, get the records from localStorage
      const storage = getStorage();
      return storage[collectionId] || [];
    }
    
    // TODO: Implement actual Ceramic network record retrieval
    // For now, we'll just return a placeholder
    return [];
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
    // Validate the data against the schema
    const validationResult = validateData(dataType, content);
    if (!validationResult.valid) {
      throw new Error(`Invalid data for ${dataType}: ${validationResult.errors.join(', ')}`);
    }
    
    if (ceramic.isOffline) {
      // For offline mode, update the record in localStorage
      const storage = getStorage();
      
      if (!storage[collectionId]) {
        return null;
      }
      
      const recordIndex = storage[collectionId].findIndex(record => record.id === recordId);
      
      if (recordIndex === -1) {
        return null;
      }
      
      const record = storage[collectionId][recordIndex];
      const updatedRecord: ContentRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
        content,
        tags: tags || record.tags
      };
      
      storage[collectionId][recordIndex] = updatedRecord;
      saveStorage(storage);
      
      return updatedRecord;
    }
    
    // TODO: Implement actual Ceramic network record update
    // For now, we'll just return a placeholder
    return null;
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
    if (ceramic.isOffline) {
      // For offline mode, delete the record from localStorage
      const storage = getStorage();
      
      if (!storage[collectionId]) {
        return false;
      }
      
      const initialLength = storage[collectionId].length;
      storage[collectionId] = storage[collectionId].filter(record => record.id !== recordId);
      
      if (storage[collectionId].length === initialLength) {
        return false;
      }
      
      saveStorage(storage);
      return true;
    }
    
    // TODO: Implement actual Ceramic network record deletion
    // For now, we'll just return a placeholder
    return false;
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
    if (ceramic.isOffline) {
      // For offline mode, clear the collection in localStorage
      const storage = getStorage();
      
      if (!storage[collectionId]) {
        return false;
      }
      
      storage[collectionId] = [];
      saveStorage(storage);
      
      return true;
    }
    
    // TODO: Implement actual Ceramic network collection clearing
    // For now, we'll just return a placeholder
    return false;
  });
};
