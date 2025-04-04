/**
 * ComposeDB Client Implementation
 * This file provides the client interface for interacting with ComposeDB
 */

import { CeramicClient } from '@ceramicnetwork/http-client';
import { ComposeClient } from '@composedb/client';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { monitorAsync } from '@/utils/performanceMonitor';
import { getCeramicNodeUrl } from './config';
import { DataTypeToModelMap } from './models';
import { DataType } from '@/utils/ceramicUtils';
import type { 
  ContentRecord, 
  CollectionInfo, 
  ComposeDBResult, 
  ComposeDBQueryResult 
} from '@/types/ceramic';

// Mock definition for ComposeDB client development
const mockDefinition: RuntimeCompositeDefinition = {
  models: {},
  objects: {},
  enums: {},
  accountData: {}
};

// ComposeDB client singleton
let composeClient: any = null;

/**
 * Initialize the ComposeDB client
 * @param seed Optional seed for DID authentication
 * @returns Initialized ComposeDB client
 */
export const initComposeDB = async (seed?: Uint8Array): Promise<any> => {
  return monitorAsync('initComposeDB', 'composedb', async () => {
    if (composeClient) {
      return composeClient;
    }

    // Create a Ceramic client
    const ceramic = new CeramicClient(getCeramicNodeUrl());

    // Set up DID authentication
    if (seed) {
      // If seed is provided, use it to create a DID
      const provider = new Ed25519Provider(seed);
      const did = new DID({
        provider,
        resolver: getResolver(),
      });
      await did.authenticate();
      ceramic.did = did;
    } else if (typeof window !== 'undefined' && window.ethereum) {
      // If in browser with ethereum provider, use it for authentication
      // This would be replaced with a proper wallet connection in production
      console.log('Using Ethereum provider for authentication');
      // Implementation would go here
    }

    try {
      // Create a real ComposeDB client with our mock definition
      // In production, we would use a proper definition generated from our models
      const realComposeClient = new ComposeClient({
        ceramic: ceramic as any, // Type assertion to avoid compatibility issues
        definition: mockDefinition
      });

      // Create a hybrid client that uses the real ComposeDB client where possible
      // but falls back to mock implementations for development
      composeClient = {
        ceramic,
        composeClient: realComposeClient,
        exists: async (modelName: string, query: any) => {
          // In a real implementation, we would query the model
          // For now, return false to simulate a non-existent collection
          return false;
        },
        create: async (modelName: string, data: any) => {
          // In a real implementation, we would use composeClient.executeQuery
          // For now, we'll simulate a created document
          const id = `doc-${Date.now()}`;
          return {
            documentId: id,
            streamId: `stream-${id}`,
            ...data
          };
        },
        update: async (modelName: string, id: string, data: any) => {
          // In a real implementation, we would use composeClient.executeQuery
          // For now, we'll simulate an updated document
          return {
            documentId: id,
            streamId: `stream-${id}`,
            ...data
          };
        },
        query: async ({ query }: { query: string }) => {
          try {
            // Try to use the real ComposeDB client for queries
            // This will work for simple queries that don't depend on our specific models
            return await realComposeClient.executeQuery(query);
          } catch (error) {
            console.warn('Falling back to mock query implementation:', error);
            // Fall back to mock implementation if the real client fails
            const modelName = query.includes('ProfileIndex') ? 'ProfileIndex' : 'GenericIndex';
            return {
              data: {
                [modelName]: {
                  edges: []
                }
              }
            };
          }
        }
      };
    } catch (error) {
      console.error('Error creating ComposeDB client:', error);
      // Fall back to a fully mocked client if we can't create a real one
      composeClient = {
        ceramic,
        exists: async (modelName: string, query: any) => false,
        create: async (modelName: string, data: any) => {
          const id = `doc-${Date.now()}`;
          return {
            documentId: id,
            streamId: `stream-${id}`,
            ...data
          };
        },
        update: async (modelName: string, id: string, data: any) => {
          return {
            documentId: id,
            streamId: `stream-${id}`,
            ...data
          };
        },
        query: async ({ query }: { query: string }) => {
          const modelName = query.includes('ProfileIndex') ? 'ProfileIndex' : 'GenericIndex';
          return {
            data: {
              [modelName]: {
                edges: []
              }
            }
          };
        }
      };
    }

    return composeClient;
  });
};

/**
 * Check if a collection exists for a specific data type and DID
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const checkCollectionExists = async (
  dataType: DataType,
  did: string
): Promise<CollectionInfo> => {
  return monitorAsync('checkCollectionExists', 'composedb', async () => {
    const client = await initComposeDB();
    const collectionId = `${dataType}_${did}`;
    
    // In ComposeDB, we'd check if the model exists
    // For now, we'll simulate this
    const exists = await client.exists(dataType, { controller: did });
    
    return {
      exists,
      collectionId
    };
  });
};

/**
 * Create a new collection for a specific data type and DID
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const createCollection = async (
  dataType: DataType,
  did: string
): Promise<CollectionInfo> => {
  return monitorAsync('createCollection', 'composedb', async () => {
    const client = await initComposeDB();
    const collectionId = `${dataType}_${did}`;
    
    // In ComposeDB, collections are implicit based on the model and controller
    // We'll return the collection info for consistency
    return {
      exists: true,
      collectionId
    };
  });
};

/**
 * Create a new record in a collection
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param content The content of the record
 * @param tags Optional tags for the record
 * @returns The created record
 */
export const createRecord = async (
  dataType: DataType,
  collectionId: string,
  content: any,
  tags: string[] = []
): Promise<ContentRecord> => {
  return monitorAsync('createRecord', 'composedb', async () => {
    const client = await initComposeDB();
    
    // Prepare the record data
    const now = new Date().toISOString();
    const recordData = {
      ...content,
      createdAt: now,
      updatedAt: now,
      tags
    };
    
    // Get the model for this data type
    const modelName = dataType;
    
    // Create the record in ComposeDB
    const result = await client.create(modelName, recordData) as ComposeDBResult;
    
    // Extract the DID from the collection ID
    const did = collectionId.split('_')[1];
    
    // Return the record in our standard format
    return {
      id: result.documentId,
      streamId: result.streamId,
      controller: did,
      createdAt: now,
      updatedAt: now,
      content: recordData,
      tags
    };
  });
};

/**
 * Get all records from a collection
 * @param collectionId The ID of the collection
 * @returns Array of records
 */
export const getRecords = async (
  collectionId: string
): Promise<ContentRecord[]> => {
  return monitorAsync('getRecords', 'composedb', async () => {
    const client = await initComposeDB();
    
    // Extract the data type and DID from the collection ID
    const [dataType, did] = collectionId.split('_');
    
    // Get the model for this data type
    const modelName = dataType;
    
    // Query records from ComposeDB
    const result = await client.query({
      query: `
        query {
          ${modelName}Index(filters: { where: { controller: { equalTo: "${did}" } } }) {
            edges {
              node {
                id
                controller
                createdAt
                updatedAt
                content
                tags
              }
            }
          }
        }
      `
    }) as ComposeDBQueryResult;
    
    // Transform the result into our standard format
    const indexData = result.data[`${modelName}Index`];
    if (!indexData || !indexData.edges) {
      return [];
    }
    
    const records: ContentRecord[] = indexData.edges.map((edge) => {
      const node = edge.node;
      return {
        id: node.id,
        streamId: node.id, // In ComposeDB, streamId is the same as id
        controller: node.controller,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        content: node.content,
        tags: node.tags || []
      };
    });
    
    return records;
  });
};

/**
 * Update a record in a collection
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to update
 * @param content The new content of the record
 * @param tags Optional new tags for the record
 * @returns The updated record or null if not found
 */
export const updateRecord = async (
  dataType: DataType,
  collectionId: string,
  recordId: string,
  content: any,
  tags?: string[]
): Promise<ContentRecord | null> => {
  return monitorAsync('updateRecord', 'composedb', async () => {
    const client = await initComposeDB();
    
    // Get the model for this data type
    const modelName = dataType;
    
    // Prepare the update data
    const now = new Date().toISOString();
    const updateData = {
      ...content,
      updatedAt: now
    };
    
    if (tags) {
      updateData.tags = tags;
    }
    
    // Update the record in ComposeDB
    try {
      const result = await client.update(modelName, recordId, updateData) as ComposeDBResult;
      
      // Extract the DID from the collection ID
      const did = collectionId.split('_')[1];
      
      // Return the updated record in our standard format
      return {
        id: result.documentId,
        streamId: result.streamId,
        controller: did,
        createdAt: result.createdAt || now, // Use the original createdAt if available
        updatedAt: now,
        content: { ...content, ...updateData },
        tags: tags || []
      };
    } catch (error) {
      console.error('Error updating record:', error);
      return null;
    }
  });
};

/**
 * Delete a record from a collection
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to delete
 * @returns Whether the record was deleted
 */
export const deleteRecord = async (
  collectionId: string,
  recordId: string
): Promise<boolean> => {
  return monitorAsync('deleteRecord', 'composedb', async () => {
    const client = await initComposeDB();
    
    // Extract the data type from the collection ID
    const [dataType] = collectionId.split('_');
    
    // Get the model for this data type
    const modelName = dataType;
    
    try {
      // In ComposeDB, we can't actually delete records, but we can mark them as deleted
      // by updating a special field
      await client.update(modelName, recordId, { 
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting record:', error);
      return false;
    }
  });
};

/**
 * Clear a collection
 * @param collectionId The ID of the collection to clear
 * @returns Whether the collection was cleared
 */
export const clearCollection = async (
  collectionId: string
): Promise<boolean> => {
  return monitorAsync('clearCollection', 'composedb', async () => {
    try {
      // Get all records in the collection
      const records = await getRecords(collectionId);
      
      // Delete each record
      const deletePromises = records.map(record => 
        deleteRecord(collectionId, record.id)
      );
      
      // Wait for all deletions to complete
      const results = await Promise.all(deletePromises);
      
      // Return true if all records were deleted
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error clearing collection:', error);
      return false;
    }
  });
};
