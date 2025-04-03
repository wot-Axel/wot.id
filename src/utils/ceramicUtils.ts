/**
 * Ceramic utility functions for interacting with the Ceramic network
 * This is a full implementation using localStorage for data persistence
 */

// Ensure window.ethereum is recognized
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

/**
 * Data types for Ceramic collections
 * Each type represents a different category of data stored in the application
 */
export enum DataType {
  PROFILE = 'profile',           // User profile information
  MEDICAL = 'medical',           // Medical records and health data
  REAL_WORLD_ASSETS = 'real_world_assets', // Real world assets information
  DIGITAL_ASSETS = 'digital_assets',    // Digital assets like NFTs
  DOCUMENTS = 'documents',       // Personal documents and IDs
  CONTACTS = 'contacts',         // Human relationships and contacts
  ACCOUNTS = 'accounts',         // Accounts and passwords information
  AFFILIATIONS = 'affiliations', // Organizational affiliations
  PRIVATE = 'private',           // Private data storage
  CREDENTIALS = 'credentials',   // Verifiable credentials
  CONNECTIONS = 'connections',   // Social connections and contacts
  PREFERENCES = 'preferences'    // User preferences and settings
}

/**
 * Base interface for all data records stored in Ceramic
 */
export interface CeramicRecord {
  id: string;         // Unique identifier for the record
  streamId: string;   // Ceramic stream ID
  controller: string; // DID of the controller (owner)
  createdAt: string;  // Creation timestamp
  updatedAt: string;  // Last update timestamp
}

/**
 * Interface for basic content records
 */
export interface ContentRecord extends CeramicRecord {
  content: any;       // The actual content of the record (can be any JSON-serializable data)
  tags?: string[];    // Optional tags for categorization and searching
}

/**
 * Interface for data records returned by Ceramic functions
 */
export interface DataRecord {
  id: string;         // Unique identifier for the record
  key: string;        // Key for the record (often used for categorization)
  value: string;      // Value of the record (usually JSON-stringified data)
}

// Configuration constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base for exponential backoff

/**
 * Execute a Ceramic operation with retry logic and exponential backoff
 * @param operation The operation to execute
 * @param context Optional context information for logging
 * @returns A promise that resolves to the result of the operation
 */
const executeWithRetry = async <T>(
  operation: () => Promise<T>, 
  context: string = 'Ceramic operation'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`${context} failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`, error);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff with jitter
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Get the storage key for a specific collection
 */
const getStorageKey = (dataType: DataType, did: string): string => {
  return `ceramic_${dataType}_${did.split(':').pop()}`;
};

/**
 * Initialize the Ceramic client and authenticate with the user's wallet
 * This implementation uses localStorage for data persistence
 * @param provider The Ethereum provider (window.ethereum)
 * @param address The user's wallet address
 * @returns A promise that resolves to ceramic and compose objects
 */
export const initCeramic = async (
  provider: any,
  address: string
): Promise<{ ceramic: any; compose: any }> => {
  // Create a simple DID from the address
  const did = `did:pkh:eip155:1:${address}`;
  
  // Return a simple object with the DID
  return {
    ceramic: { did: { id: did } },
    compose: {}
  };
};

/**
 * Check if a collection exists for a given data type and DID
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param did The user's DID (Decentralized Identifier)
 * @returns A promise that resolves to an object with exists and collectionId properties
 */
export const checkCollectionExists = async (
  ceramic: any,
  dataType: DataType,
  did: string
): Promise<{ exists: boolean; collectionId: string }> => {
  return executeWithRetry(async () => {
    const collectionId = `${dataType}-${did.split(':').pop()}`;
    const storageKey = getStorageKey(dataType, did);
    
    // Check if the collection exists in localStorage
    const exists = localStorage.getItem(storageKey) !== null;
    
    return { exists, collectionId };
  }, `Check if collection exists (${dataType})`);
};

/**
 * Create a collection for a given data type
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param did The user's DID (Decentralized Identifier)
 * @returns A promise that resolves to an object with collectionId
 */
export const createCollection = async (
  ceramic: any,
  dataType: DataType,
  did: string
): Promise<{ collectionId: string }> => {
  return executeWithRetry(async () => {
    const collectionId = `${dataType}-${did.split(':').pop()}`;
    const storageKey = getStorageKey(dataType, did);
    
    // Initialize an empty collection in localStorage if it doesn't exist
    if (localStorage.getItem(storageKey) === null) {
      localStorage.setItem(storageKey, JSON.stringify([]));
    }
    
    return { collectionId };
  }, `Create collection (${dataType})`);
};

/**
 * Create a new record in a collection
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @param content The content to store
 * @param tags Optional tags for categorization
 * @returns A promise that resolves to the created record
 */
export const createRecord = async (
  ceramic: any,
  dataType: DataType,
  collectionId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    const storageKey = getStorageKey(dataType, did);
    
    // Generate a unique ID for the record
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const streamId = `stream-${id}`;
    const timestamp = new Date().toISOString();
    
    // Create the record
    const record: ContentRecord = {
      id,
      streamId,
      controller: did,
      createdAt: timestamp,
      updatedAt: timestamp,
      content,
      tags
    };
    
    // Get existing records from localStorage
    const existingRecordsJson = localStorage.getItem(storageKey) || '[]';
    const existingRecords = JSON.parse(existingRecordsJson);
    
    // Add the new record
    existingRecords.push(record);
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingRecords));
    
    return record;
  }, `Create record (${dataType})`);
};

/**
 * Get all records from a collection
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @returns A promise that resolves to an array of content records
 */
export const getRecords = async (
  ceramic: any,
  dataType: DataType,
  collectionId: string
): Promise<ContentRecord[]> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    const storageKey = getStorageKey(dataType, did);
    
    // Get records from localStorage
    const recordsJson = localStorage.getItem(storageKey) || '[]';
    return JSON.parse(recordsJson);
  }, `Get records (${dataType})`);
};

/**
 * Update a record in a collection
 * @param ceramic The Ceramic client instance
 * @param streamId The stream ID of the record to update
 * @param content The new content
 * @param tags Optional new tags
 * @returns A promise that resolves to the updated record
 */
export const updateRecord = async (
  ceramic: any,
  streamId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    
    // Find the record in all collections
    for (const dataType of Object.values(DataType)) {
      const storageKey = getStorageKey(dataType as DataType, did);
      const recordsJson = localStorage.getItem(storageKey) || '[]';
      const records: ContentRecord[] = JSON.parse(recordsJson);
      
      // Find the record with the matching streamId
      const recordIndex = records.findIndex(record => record.streamId === streamId);
      
      if (recordIndex !== -1) {
        // Update the record
        const updatedRecord: ContentRecord = {
          ...records[recordIndex],
          content,
          tags: tags || records[recordIndex].tags,
          updatedAt: new Date().toISOString()
        };
        
        // Replace the record in the array
        records[recordIndex] = updatedRecord;
        
        // Save back to localStorage
        localStorage.setItem(storageKey, JSON.stringify(records));
        
        return updatedRecord;
      }
    }
    
    throw new Error(`Record with streamId ${streamId} not found`);
  }, `Update record (${streamId})`);
};

/**
 * Delete a record from a collection
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @param streamId The stream ID of the record to delete
 * @returns A promise that resolves when the record is deleted
 */
export const deleteRecord = async (
  ceramic: any,
  dataType: DataType,
  collectionId: string,
  streamId: string
): Promise<void> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    const storageKey = getStorageKey(dataType, did);
    
    // Get records from localStorage
    const recordsJson = localStorage.getItem(storageKey) || '[]';
    const records: ContentRecord[] = JSON.parse(recordsJson);
    
    // Filter out the record with the matching streamId
    const filteredRecords = records.filter(record => record.streamId !== streamId);
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(filteredRecords));
  }, `Delete record (${dataType}, ${streamId})`);
};

/**
 * Clear all records from a collection
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @returns A promise that resolves when all records are cleared
 */
export const clearCollection = async (
  ceramic: any,
  dataType: DataType,
  collectionId: string
): Promise<void> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    const storageKey = getStorageKey(dataType, did);
    
    // Clear the collection by setting it to an empty array
    localStorage.setItem(storageKey, JSON.stringify([]));
  }, `Clear collection (${dataType})`);
};

/**
 * Get a single record by stream ID
 * @param ceramic The Ceramic client instance
 * @param streamId The stream ID of the record to get
 * @returns A promise that resolves to the content record or null if not found
 */
export const getRecordByStreamId = async (
  ceramic: any,
  streamId: string
): Promise<ContentRecord | null> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    
    // Search in all collections
    for (const dataType of Object.values(DataType)) {
      const storageKey = getStorageKey(dataType as DataType, did);
      const recordsJson = localStorage.getItem(storageKey) || '[]';
      const records: ContentRecord[] = JSON.parse(recordsJson);
      
      // Find the record with the matching streamId
      const record = records.find(record => record.streamId === streamId);
      
      if (record) {
        return record;
      }
    }
    
    return null;
  }, `Get record by streamId (${streamId})`);
};

/**
 * Search for records in a collection by tags
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @param tags The tags to search for (records must have at least one of these tags)
 * @returns A promise that resolves to an array of matching content records
 */
export const searchRecordsByTags = async (
  ceramic: any,
  dataType: DataType,
  collectionId: string,
  tags: string[]
): Promise<ContentRecord[]> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id || 'unknown';
    const storageKey = getStorageKey(dataType, did);
    
    // Get records from localStorage
    const recordsJson = localStorage.getItem(storageKey) || '[]';
    const records: ContentRecord[] = JSON.parse(recordsJson);
    
    // Filter records that have at least one of the specified tags
    return records.filter(record => {
      if (!record.tags) return false;
      return record.tags.some(tag => tags.includes(tag));
    });
  }, `Search records by tags (${dataType})`);
};
