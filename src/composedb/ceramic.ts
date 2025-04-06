/**
 * Ceramic Integration
 * 
 * This file serves as the single source of truth for all Ceramic types, interfaces,
 * and utility functions. It consolidates functionality from multiple files to avoid
 * circular dependencies and type conflicts.
 */

import { CeramicClient as CeramicHttpClient } from '@ceramicnetwork/http-client';
import type { DID } from 'dids';
import { monitorAsync } from '../utils/performanceMonitor';
import { validateData } from '../utils/schemaValidation';
import { 
  connectToCeramic, 
  resetFailedNodes, 
  getConnectionStatus 
} from '../utils/ceramicConnector';
import {
  createMockCeramicClient,
  shouldUseMockImplementation
} from './ceramic-mock';

// ==============================
// Core Types and Interfaces
// ==============================

/**
 * DataType enum - defines all possible data types in the system
 * This is the canonical definition that should be used throughout the application
 */
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  CONNECTIONS = 'connections',
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}

/**
 * CeramicClient type - represents a Ceramic client with additional properties
 * We're using a type alias instead of an interface extension to avoid conflicts
 */
export type CeramicClient = CeramicHttpClient & {
  isOffline?: boolean;
  did?: DID;
};

/**
 * ContentRecord interface - represents a record stored in Ceramic
 */
export interface ContentRecord {
  id: string;
  streamId: string;
  controller: string;
  createdAt: string;
  updatedAt: string;
  content: any;
  tags?: string[];
}

/**
 * CollectionInfo interface - information about a collection in Ceramic
 */
export interface CollectionInfo {
  exists: boolean;
  collectionId: string;
}

/**
 * TableData interface - for displaying data in tables
 */
export interface TableData {
  id: string;
  name: string;
  value: string;
  date: string;
}

/**
 * Database interface - for interacting with database-like storage
 */
export interface Database {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * PrivateData interface - for storing private data
 */
export interface PrivateData {
  id: string;
  type: string;
  content: any;
  encrypted: boolean;
}

// ==============================
// Core Ceramic Utilities
// ==============================

// Storage key for localStorage
const CERAMIC_STORAGE_KEY = 'ceramic_local_storage';

/**
 * Initialize Ceramic client with multi-node fallback strategy
 * @param identity Optional user identity for deterministic DID generation
 * @returns Initialized Ceramic client
 */
export const initCeramic = async (identity?: string): Promise<CeramicClient> => {
  return monitorAsync('initCeramic', 'ceramicUtils', async () => {
    // Check if we should use the mock implementation in production
    if (shouldUseMockImplementation()) {
      console.log('Using mock Ceramic implementation in production environment');
      return createMockCeramicClient();
    }
    
    // In development, try to connect using our robust connection strategy
    const ceramic = await connectToCeramic(identity);
    
    if (!ceramic) {
      console.error('Failed to connect to any Ceramic node. Using fallback local implementation.');
      // Return a mock client for offline functionality
      return createMockCeramicClient();
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
    console.log('Cleared all collections from storage');
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
};

// ==============================
// Collection Management
// ==============================

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
 * Ensure a collection exists, creating it if it doesn't
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const ensureCollection = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<CollectionInfo> => {
  const collectionInfo = await checkCollectionExists(ceramic, dataType, did);
  
  if (!collectionInfo.exists) {
    return createCollection(ceramic, dataType, did);
  }
  
  return collectionInfo;
};

// ==============================
// Record Management
// ==============================

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
        controller: ceramic.did ? ceramic.did.id : 'unknown',
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
      controller: ceramic.did ? ceramic.did.id : 'unknown',
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

// ==============================
// Legacy Compatibility Layer
// ==============================

/**
 * Get records using the legacy format (for backward compatibility)
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Array of records
 */
export const getRecordsByType = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<ContentRecord[]> => {
  // First ensure the collection exists
  const collectionInfo = await ensureCollection(ceramic, dataType, did);
  // Then get records using the collection ID
  return getRecords(ceramic, collectionInfo.collectionId);
};

// Export everything from the ComposeDB client
export * from './client';
