/**
 * Ceramic utility functions for interacting with the Ceramic network
 * This is a clean implementation designed specifically for Ceramic without any legacy constraints
 */
import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { ComposeClient } from '@composedb/client';
import { v4 as uuidv4 } from 'uuid';

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
  DIGITAL_ASSETS = 'digital_assets', // Digital assets and NFTs
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

// Configuration constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base for exponential backoff
const CERAMIC_API_URL = 'https://ceramic-clay.3boxlabs.com';

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
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`${context} failed (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}):`, error);
      
      // If this is not the last attempt, wait before retrying with exponential backoff
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`${context} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
};

/**
 * Initialize the Ceramic client and authenticate with the user's wallet
 * @param provider The Ethereum provider (window.ethereum)
 * @param address The user's wallet address
 * @returns A promise that resolves to the authenticated Ceramic client and ComposeDB client
 */
export const initCeramic = async (
  provider: any,
  address: string
): Promise<{ ceramic: CeramicClient; compose: ComposeClient }> => {
  return executeWithRetry(async () => {
    // Create a new Ceramic client
    const ceramic = new CeramicClient(CERAMIC_API_URL);
    
    // Create a ComposeDB client (simplified for now)
    const compose = new ComposeClient({
      ceramic: ceramic as any,
      definition: { models: {} } // Empty definition for now
    });
    
    if (!provider) {
      throw new Error('No Ethereum provider found');
    }
    
    // Get the Ethereum account ID
    const accountId = await getAccountId(provider, address);
    
    // Create a DID instance using the wallet
    const authMethod = await EthereumWebAuth.getAuthMethod(provider, accountId);
    const did = new DID({ provider: authMethod });
    
    // Authenticate the DID
    await did.authenticate();
    
    // Set the DID on the Ceramic client
    ceramic.did = did;
    
    return { ceramic, compose };
  }, 'Initialize Ceramic');
};

// Helper function to get account ID (simplified implementation)
const getAccountId = async (provider: any, address: string) => {
  // In a real implementation, we would use @didtools/pkh-ethereum
  return { chainId: 'eip155:1', address };
};

// Helper class for Ethereum Web Authentication (simplified implementation)
class EthereumWebAuth {
  static async getAuthMethod(provider: any, accountId: any) {
    // In a real implementation, we would use @didtools/pkh-ethereum
    return {
      id: `did:pkh:eip155:1:${accountId.address}`,
      authenticate: async () => ({ id: `did:pkh:eip155:1:${accountId.address}` })
    };
  }
}

/**
 * Check if a collection exists for a given data type and DID
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param did The user's DID (Decentralized Identifier)
 * @returns A promise that resolves to an object with exists and collectionId properties
 */
export const checkCollectionExists = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<{ exists: boolean; collectionId: string }> => {
  return executeWithRetry(async () => {
    try {
      // Collection ID is based on the data type and DID
      const collectionId = `${dataType}-${did.split(':').pop()}`;
      
      // Try to load the collection index document
      const indexDocId = `${collectionId}-index`;
      const stream = await TileDocument.deterministic(ceramic, {
        controllers: [did],
        family: indexDocId
      });
      
      // If we can load the document, the collection exists
      await stream.content;
      return { exists: true, collectionId };
    } catch (error) {
      // If the document doesn't exist, return false
      return { exists: false, collectionId: '' };
    }
  }, `Check collection exists (${dataType})`);
};

/**
 * Create a collection for a given data type
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param did The user's DID (Decentralized Identifier)
 * @returns A promise that resolves to an object with collectionId
 */
export const createCollection = async (
  ceramic: CeramicClient,
  dataType: DataType,
  did: string
): Promise<{ collectionId: string }> => {
  return executeWithRetry(async () => {
    // Collection ID is based on the data type and DID
    const collectionId = `${dataType}-${did.split(':').pop()}`;
    
    // Create an index document for the collection
    const indexDocId = `${collectionId}-index`;
    const stream = await TileDocument.deterministic(ceramic, {
      controllers: [did],
      family: indexDocId
    });
    
    // Initialize the index with an empty array of record IDs
    await stream.update({ recordIds: [] });
    
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
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord> => {
  return executeWithRetry(async () => {
    const timestamp = new Date().toISOString();
    const did = ceramic.did?.id;
    
    if (!did) {
      throw new Error('No DID available. Make sure you are authenticated.');
    }
    
    // Create a new document for the record
    const stream = await TileDocument.create(ceramic, {
      content,
      tags,
      createdAt: timestamp,
      updatedAt: timestamp
    }, {
      controllers: [did],
      family: collectionId
    });
    
    // Get the index document
    const indexDocId = `${collectionId}-index`;
    const indexStream = await TileDocument.deterministic(ceramic, {
      controllers: [did],
      family: indexDocId
    });
    
    // Update the index with the new record ID
    const index = indexStream.content as { recordIds: string[] } || { recordIds: [] };
    const recordIds = [...(index.recordIds || []), stream.id.toString()];
    await indexStream.update({ recordIds });
    
    // Return the record
    return {
      id: uuidv4(), // Client-side ID for reference
      streamId: stream.id.toString(),
      controller: did,
      createdAt: timestamp,
      updatedAt: timestamp,
      content,
      tags
    };
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
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string
): Promise<ContentRecord[]> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id;
    
    if (!did) {
      throw new Error('No DID available. Make sure you are authenticated.');
    }
    
    // Get the index document
    const indexDocId = `${collectionId}-index`;
    const indexStream = await TileDocument.deterministic(ceramic, {
      controllers: [did],
      family: indexDocId
    });
    
    // Get the record IDs from the index
    const index = indexStream.content as { recordIds: string[] } || { recordIds: [] };
    const recordIds = index.recordIds || [];
    
    // Load each record
    const records: ContentRecord[] = [];
    
    for (const streamId of recordIds) {
      try {
        const stream = await TileDocument.load(ceramic, streamId);
        const content = stream.content;
        
        if (content) {
          records.push({
            id: uuidv4(), // Client-side ID for reference
            streamId,
            controller: stream.controllers[0],
            createdAt: content.createdAt || new Date().toISOString(),
            updatedAt: content.updatedAt || new Date().toISOString(),
            content: content.content || content,
            tags: content.tags
          });
        }
      } catch (e) {
        console.error(`Error loading record ${streamId}:`, e);
        // Continue with other records even if one fails
      }
    }
    
    return records;
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
  ceramic: CeramicClient,
  streamId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord> => {
  return executeWithRetry(async () => {
    const timestamp = new Date().toISOString();
    const did = ceramic.did?.id;
    
    if (!did) {
      throw new Error('No DID available. Make sure you are authenticated.');
    }
    
    // Load the existing document
    const stream = await TileDocument.load(ceramic, streamId);
    
    // Update the document
    await stream.update({
      content,
      tags,
      updatedAt: timestamp
    });
    
    // Return the updated record
    return {
      id: uuidv4(), // Client-side ID for reference
      streamId: stream.id.toString(),
      controller: did,
      createdAt: stream.content.createdAt || timestamp,
      updatedAt: timestamp,
      content,
      tags
    };
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
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string,
  streamId: string
): Promise<void> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id;
    
    if (!did) {
      throw new Error('No DID available. Make sure you are authenticated.');
    }
    
    // Get the index document
    const indexDocId = `${collectionId}-index`;
    const indexStream = await TileDocument.deterministic(ceramic, {
      controllers: [did],
      family: indexDocId
    });
    
    // Update the index to remove the record ID
    const index = indexStream.content as { recordIds: string[] } || { recordIds: [] };
    const recordIds = (index.recordIds || []).filter(id => id !== streamId);
    await indexStream.update({ recordIds });
    
    // Note: We can't actually delete the document from Ceramic,
    // but we can remove it from our index so it won't be retrieved
  }, `Delete record (${dataType})`);
};

/**
 * Clear all records from a collection
 * @param ceramic The Ceramic client instance
 * @param dataType The type of data
 * @param collectionId The collection ID
 * @returns A promise that resolves when all records are cleared
 */
export const clearCollection = async (
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string
): Promise<void> => {
  return executeWithRetry(async () => {
    const did = ceramic.did?.id;
    
    if (!did) {
      throw new Error('No DID available. Make sure you are authenticated.');
    }
    
    // Get the index document
    const indexDocId = `${collectionId}-index`;
    const indexStream = await TileDocument.deterministic(ceramic, {
      controllers: [did],
      family: indexDocId
    });
    
    // Clear the index
    await indexStream.update({ recordIds: [] });
    
    // Note: We can't actually delete the documents from Ceramic,
    // but we can clear our index so they won't be retrieved
  }, `Clear collection (${dataType})`);
};

/**
 * Get a single record by stream ID
 * @param ceramic The Ceramic client instance
 * @param streamId The stream ID of the record to get
 * @returns A promise that resolves to the content record or null if not found
 */
export const getRecordByStreamId = async (
  ceramic: CeramicClient,
  streamId: string
): Promise<ContentRecord | null> => {
  return executeWithRetry(async () => {
    try {
      const stream = await TileDocument.load(ceramic, streamId);
      const content = stream.content;
      
      if (!content) {
        return null;
      }
      
      return {
        id: uuidv4(), // Client-side ID for reference
        streamId: stream.id.toString(),
        controller: stream.controllers[0],
        createdAt: content.createdAt || new Date().toISOString(),
        updatedAt: content.updatedAt || new Date().toISOString(),
        content: content.content || content,
        tags: content.tags
      };
    } catch (e) {
      console.error(`Error loading record ${streamId}:`, e);
      return null;
    }
  }, `Get record (${streamId})`);
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
  ceramic: CeramicClient,
  dataType: DataType,
  collectionId: string,
  tags: string[]
): Promise<ContentRecord[]> => {
  // Get all records and filter by tags
  const records = await getRecords(ceramic, dataType, collectionId);
  
  if (tags.length === 0) {
    return records;
  }
  
  return records.filter(record => {
    if (!record.tags || record.tags.length === 0) {
      return false;
    }
    
    return record.tags.some(tag => tags.includes(tag));
  });
};
