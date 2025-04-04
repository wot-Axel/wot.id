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

// Storage key for DID seed
const DID_SEED_STORAGE_KEY = 'wot-id-did-seed';

// ComposeDB client singleton
let composeClient: any = null;

/**
 * Generate or retrieve a persistent DID seed
 * @returns Uint8Array seed for DID generation
 */
const getPersistentDIDSeed = (): Uint8Array => {
  if (typeof window === 'undefined') {
    // Server-side, generate a temporary seed
    return crypto.getRandomValues(new Uint8Array(32));
  }
  
  // Check if we have a stored seed
  const storedSeed = localStorage.getItem(DID_SEED_STORAGE_KEY);
  
  if (storedSeed) {
    try {
      // Convert stored hex string back to Uint8Array
      const seedArray = JSON.parse(storedSeed);
      return new Uint8Array(seedArray);
    } catch (error) {
      console.error('Error parsing stored DID seed, generating new one:', error);
    }
  }
  
  // Generate a new seed if none exists or parsing failed
  const newSeed = crypto.getRandomValues(new Uint8Array(32));
  
  // Store the seed for future sessions
  try {
    localStorage.setItem(DID_SEED_STORAGE_KEY, JSON.stringify(Array.from(newSeed)));
    console.log('Generated and stored new DID seed for persistent identity');
  } catch (error) {
    console.error('Error storing DID seed:', error);
  }
  
  return newSeed;
};

/**
 * Initialize the ComposeDB client
 * @param forceSeed Optional seed to force for DID authentication (overrides stored seed)
 * @returns Initialized ComposeDB client
 */
export const initComposeDB = async (forceSeed?: Uint8Array): Promise<any> => {
  return monitorAsync('initComposeDB', 'composedb', async () => {
    if (composeClient) {
      return composeClient;
    }

    // Create a Ceramic client
    const ceramic = new CeramicClient(getCeramicNodeUrl());

    // Get the persistent seed or use the forced seed if provided
    const seed = forceSeed || getPersistentDIDSeed();
    
    // Set up DID authentication with the persistent seed
    const provider = new Ed25519Provider(seed);
    const did = new DID({
      provider,
      resolver: getResolver(),
    });
    
    await did.authenticate();
    ceramic.did = did;
    
    console.log('Connected to Ceramic network with DID:', did.id);

    // Create a real ComposeDB client with our definition
    const realComposeClient = new ComposeClient({
      ceramic: ceramic as any, // Type assertion to avoid compatibility issues
      definition: mockDefinition
    });

    // Create a client that uses the Ceramic network for data storage
    composeClient = {
      ceramic,
      composeClient: realComposeClient,
      
      // Check if a model exists
      exists: async (modelName: string, query: any) => {
        try {
          // For now, use a simplified approach to check existence
          // Query for all documents and check if any match
          const result = await realComposeClient.executeQuery(`
            query {
              viewer {
                ${modelName}Index(first: 10) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          `);
          
          // Check if we got any results
          const viewerData = result?.data?.viewer as Record<string, any>;
          const modelData = viewerData?.[`${modelName}Index`] as { edges: any[] } | undefined;
          const edges = modelData?.edges || [];
          return edges.length > 0;
        } catch (error) {
          console.error(`Error checking if ${modelName} exists:`, error);
          return false;
        }
      },
      
      // Create a new model instance
      create: async (modelName: string, data: any) => {
        try {
          // Use ComposeDB to create a new document
          const mutation = `
            mutation {
              create${modelName}(
                input: {
                  content: ${JSON.stringify({
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })}
                }
              ) {
                document {
                  id
                  content
                }
              }
            }
          `;
          
          const result = await realComposeClient.executeQuery(mutation);
          const resultData = result?.data as Record<string, any> || {};
          const createResult = resultData[`create${modelName}`] as Record<string, any> || {};
          const document = createResult.document as { id: string; content: any } | undefined;
          
          if (!document) {
            throw new Error(`Failed to create ${modelName}`);
          }
          
          // Return the created document with our expected format
          return {
            documentId: document.id,
            streamId: document.id,
            ...document.content
          };
        } catch (error) {
          console.error(`Error creating ${modelName}:`, error);
          throw error;
        }
      },
      
      // Update an existing model
      update: async (modelName: string, id: string, data: any) => {
        try {
          // Use ComposeDB to update the document
          const mutation = `
            mutation {
              update${modelName}(
                input: {
                  id: "${id}"
                  content: ${JSON.stringify({
                    ...data,
                    updatedAt: new Date().toISOString()
                  })}
                }
              ) {
                document {
                  id
                  content
                }
              }
            }
          `;
          
          const result = await realComposeClient.executeQuery(mutation);
          const resultData = result?.data as Record<string, any> || {};
          const updateResult = resultData[`update${modelName}`] as Record<string, any> || {};
          const document = updateResult.document as { id: string; content: any } | undefined;
          
          if (!document) {
            return null;
          }
          
          // Return the updated document
          return {
            documentId: document.id,
            streamId: document.id,
            ...document.content
          };
        } catch (error) {
          console.error(`Error updating ${modelName}:`, error);
          return null;
        }
      },
      
      // Query for models
      query: async ({ query }: { query: string }) => {
        try {
          // Execute the query directly using the ComposeDB client
          return await realComposeClient.executeQuery(query);
        } catch (error) {
          console.error('Error executing query:', error);
          
          // Return empty result on error
          const modelNameMatch = query.match(/viewer\s*{\s*(\w+)\s*{/i);
          const modelName = modelNameMatch ? modelNameMatch[1] : 'GenericIndex';
          
          return {
            data: {
              viewer: {
                [modelName]: {
                  edges: []
                }
              }
            }
          };
        }
      },
      
      // List all documents of a model type
      list: async (modelName: string) => {
        try {
          // Query for all documents of this model type
          const result = await realComposeClient.executeQuery(`
            query {
              viewer {
                ${modelName}Index(first: 100) {
                  edges {
                    node {
                      id
                      content
                    }
                  }
                }
              }
            }
          `);
          
          const viewerData = result?.data?.viewer as Record<string, any> || {};
          const modelData = viewerData[`${modelName}Index`] as { edges: any[] } | undefined;
          const edges = modelData?.edges || [];
          
          return edges.map((edge: any) => ({
            documentId: edge.node.id,
            streamId: edge.node.id,
            ...edge.node.content
          }));
        } catch (error) {
          console.error(`Error listing ${modelName}:`, error);
          return [];
        }
      }
    };
    
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
