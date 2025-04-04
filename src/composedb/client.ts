/**
 * ComposeDB Client Implementation
 * This file provides the client interface for interacting with ComposeDB
 */

import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { ComposeClient } from '@composedb/client';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { monitorAsync } from '@/utils/performanceMonitor';
import { getCeramicNodeUrl, markNodeAsFailed, CERAMIC_NODES, isProduction } from './config';
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

// Storage keys
const DID_SEED_STORAGE_KEY = 'wot-id-did-seed';
const CERAMIC_CONNECTION_STATUS_KEY = 'wot-id-ceramic-connection-status';

// Connection status tracking
interface ConnectionStatus {
  lastSuccessfulNode?: string;
  lastConnectedAt?: string;
  failedNodes: string[];
}

// Get stored connection status
const getConnectionStatus = (): ConnectionStatus => {
  if (typeof window === 'undefined') {
    return { failedNodes: [] };
  }
  
  try {
    const stored = localStorage.getItem(CERAMIC_CONNECTION_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing connection status:', error);
  }
  
  return { failedNodes: [] };
};

// Save connection status
const saveConnectionStatus = (status: ConnectionStatus): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CERAMIC_CONNECTION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving connection status:', error);
  }
};

// ComposeDB client singleton
let composeClient: any = null;

/**
 * Generate or retrieve a persistent DID seed
 * This function ensures that the same DID is used across sessions
 * @param forceNew If true, generates a new seed regardless of existing one
 * @returns Uint8Array seed for DID generation
 */
const getPersistentDIDSeed = (forceNew = false): Uint8Array => {
  if (typeof window === 'undefined') {
    // Server-side, generate a deterministic seed based on a fixed value
    // This is for SSR compatibility - in real usage the client-side seed will be used
    const serverSeed = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      serverSeed[i] = i % 256; // Deterministic pattern
    }
    return serverSeed;
  }
  
  // Force new seed generation if requested
  if (forceNew) {
    const newSeed = crypto.getRandomValues(new Uint8Array(32));
    try {
      localStorage.setItem(DID_SEED_STORAGE_KEY, JSON.stringify(Array.from(newSeed)));
      console.log('Generated and stored new DID seed (forced refresh)');
    } catch (error) {
      console.error('Error storing forced new DID seed:', error);
    }
    return newSeed;
  }
  
  // Check if we have a stored seed
  const storedSeed = localStorage.getItem(DID_SEED_STORAGE_KEY);
  
  if (storedSeed) {
    try {
      // Convert stored JSON array back to Uint8Array
      const seedArray = JSON.parse(storedSeed);
      const seed = new Uint8Array(seedArray);
      console.log('Using existing persistent DID seed');
      return seed;
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
 * Get the current DID from storage or create a new one
 * @param seed Optional seed to use for DID creation
 * @returns Promise resolving to authenticated DID
 */
const getOrCreateDID = async (seed?: Uint8Array): Promise<DID> => {
  // Get the persistent seed or use the provided seed
  const didSeed = seed || getPersistentDIDSeed();
  
  // Set up DID authentication with the seed
  const provider = new Ed25519Provider(didSeed);
  const did = new DID({
    provider,
    resolver: getResolver(),
  });
  
  // Authenticate the DID
  await did.authenticate();
  
  return did;
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

    // Get connection status for tracking
    const connectionStatus = getConnectionStatus();
    
    // Implement a local-first strategy with offline capabilities
    let ceramic: CeramicClient | null = null;
    let ceramicUrl = '';
    
    // First, try to use environment variable if specified
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CERAMIC_NODE) {
      ceramicUrl = process.env.NEXT_PUBLIC_CERAMIC_NODE;
      console.log(`Using environment-specified Ceramic node: ${ceramicUrl}`);
      try {
        ceramic = new CeramicClient(ceramicUrl);
      } catch (error) {
        console.warn(`Failed to connect to environment-specified node: ${error}`);
        ceramic = null;
      }
    }
    
    // If that didn't work, try local node in development
    if (!ceramic && !isProduction && CERAMIC_NODES.includes('http://localhost:7007')) {
      try {
        console.log('Attempting to connect to local Ceramic node');
        ceramic = new CeramicClient('http://localhost:7007');
        ceramicUrl = 'http://localhost:7007';
      } catch (error) {
        console.warn('Failed to connect to local node:', error);
        ceramic = null;
      }
    }
    
    // If still no connection, try to connect to nodes in order of priority
    if (!ceramic) {
      // Prioritize last successful node if available
      if (connectionStatus.lastSuccessfulNode && !connectionStatus.failedNodes.includes(connectionStatus.lastSuccessfulNode)) {
        try {
          console.log(`Attempting to connect to previously successful node: ${connectionStatus.lastSuccessfulNode}`);
          ceramic = new CeramicClient(connectionStatus.lastSuccessfulNode);
          ceramicUrl = connectionStatus.lastSuccessfulNode;
        } catch (error) {
          console.warn(`Failed to connect to previously successful node: ${error}`);
          // Mark this node as failed
          connectionStatus.failedNodes.push(connectionStatus.lastSuccessfulNode);
          ceramic = null;
        }
      }
      
      // If still no connection, try each node in the list that hasn't failed
      if (!ceramic) {
        for (const node of CERAMIC_NODES) {
          // Skip nodes that have already failed
          if (connectionStatus.failedNodes.includes(node)) {
            console.log(`Skipping previously failed node: ${node}`);
            continue;
          }
          
          try {
            console.log(`Attempting to connect to Ceramic node: ${node}`);
            ceramic = new CeramicClient(node);
            ceramicUrl = node;
            break; // Stop once we have a successful connection
          } catch (error) {
            console.warn(`Failed to connect to node ${node}:`, error);
            // Mark this node as failed
            connectionStatus.failedNodes.push(node);
            ceramic = null;
          }
        }
      }
      
      // If all nodes failed, try the first one as a last resort
      if (!ceramic) {
        const defaultNode = CERAMIC_NODES[0];
        console.log(`All nodes failed, using default as last resort: ${defaultNode}`);
        ceramic = new CeramicClient(defaultNode);
        ceramicUrl = defaultNode;
      }
    }
    
    console.log(`Initialized Ceramic client with node: ${ceramicUrl}`);
    
    // Even if we can't connect to a node right now, we'll still create the client
    // This allows for offline-first operation with local storage fallback
    
    // Note: Different versions of CeramicClient have different APIs
    // We'll use a try-catch to handle potential compatibility issues
    try {
      // Use type assertion to handle the method that might not be in the type definitions
      const ceramicWithOptions = ceramic as any;
      if (typeof ceramicWithOptions.setClientOptions === 'function') {
        ceramicWithOptions.setClientOptions({
          syncInterval: 5000, // 5 seconds
          syncTimeoutRetries: 3,
          cacheLimit: 100,
          concurrentRequests: 10
        });
      }
    } catch (e) {
      console.warn('Could not set client options, continuing with defaults');
    }
    
    // Get or create an authenticated DID using our helper function
    // This ensures the same DID is used across sessions
    let did: DID;
    
    try {
      console.log('Authenticating DID with Ceramic...');
      // Use our new helper function to get or create a DID
      // If forceSeed is provided, it will be used instead of the stored seed
      did = await getOrCreateDID(forceSeed);
      
      // Test the connection with a simple operation
      try {
        // Create a test document to verify the connection works
        const testDoc = await TileDocument.create(
          ceramic,
          { test: 'connection', timestamp: new Date().toISOString() },
          { controllers: [did.id], family: 'wot.id-connection-test' }
        );
        
        console.log('Successfully created test document with ID:', testDoc.id.toString());
        console.log('Using DID:', did.id);
        
        // Connection successful, update status
        connectionStatus.lastSuccessfulNode = ceramicUrl;
        connectionStatus.lastConnectedAt = new Date().toISOString();
        // Clear failed nodes on successful connection
        connectionStatus.failedNodes = [];
        saveConnectionStatus(connectionStatus);
      } catch (testError: unknown) {
        const error = testError instanceof Error ? testError : new Error(String(testError));
        console.error('Failed to create test document:', error);
        // Mark this node as failed
        if (!connectionStatus.failedNodes.includes(ceramicUrl)) {
          connectionStatus.failedNodes.push(ceramicUrl);
          saveConnectionStatus(connectionStatus);
        }
        throw new Error(`Failed to verify Ceramic connection: ${error.message}`);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error authenticating with Ceramic node at ${ceramicUrl}:`, error);
      
      // Mark this node as failed
      if (!connectionStatus.failedNodes.includes(ceramicUrl)) {
        connectionStatus.failedNodes.push(ceramicUrl);
        saveConnectionStatus(connectionStatus);
      }
      
      // Try to connect with a different node
      const remainingNodes = CERAMIC_NODES.filter((node: string) => !connectionStatus.failedNodes.includes(node));
      if (remainingNodes.length > 0) {
        console.log(`Trying alternative Ceramic node from remaining ${remainingNodes.length} nodes...`);
        // Recursively try with a different node
        return initComposeDB(forceSeed);
      }
      
      throw new Error(`Failed to connect to any Ceramic node: ${error.message}`);
    }
    // Ensure ceramic is not null before assigning DID
    if (ceramic) {
      ceramic.did = did;
      console.log('Connected to Ceramic network with DID:', did.id);
    } else {
      throw new Error('Ceramic client is null, cannot assign DID');
    }

    // Create a real ComposeDB client with our definition
    console.log('Creating ComposeDB client with Ceramic instance');
    
    // Ensure ceramic is not null before creating ComposeDB client
    if (!ceramic) {
      throw new Error('Cannot create ComposeDB client: Ceramic client is null');
    }
    
    const realComposeClient = new ComposeClient({
      ceramic: ceramic as any, // Type assertion needed due to version mismatches between dependencies
      definition: mockDefinition
    });
    
    // Add additional error handling for ComposeDB operations
    // We'll handle errors at the query call sites instead of modifying the executeQuery method

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
      
      // Create a new model instance using TileDocument directly
      create: async (modelName: string, data: Record<string, any>) => {
        try {
          console.log(`Creating ${modelName} with data:`, data);
          
          // Create a TileDocument directly with the Ceramic client
          // This bypasses ComposeDB and works with any Ceramic node
          const content = {
            ...data,
            modelName, // Store the model name in the document
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Store in a deterministic way based on DID and content hash
          const controller = ceramic.did?.id;
          if (!controller) {
            throw new Error('No authenticated DID available');
          }
          
          // Create the document using the TileDocument API
          // We already imported TileDocument at the top of the file
          const doc = await TileDocument.create(ceramic, content as Record<string, any>, {
            controllers: [controller],
            family: `wot.id-${modelName}` // Use a consistent family for each model type
          });
          
          console.log(`Successfully created ${modelName} document:`, doc.id.toString());
          
          // Store the document ID in localStorage for easy retrieval
          // This is in addition to the network storage
          if (typeof window !== 'undefined') {
            const storageKey = `ceramic-docs-${modelName}`;
            const existingIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingIds.push(doc.id.toString());
            localStorage.setItem(storageKey, JSON.stringify(existingIds));
          }
          
          // Return the created document with our expected format
          return {
            documentId: doc.id.toString(),
            streamId: doc.id.toString(),
            ...content
          };
        } catch (error) {
          console.error(`Error creating ${modelName}:`, error);
          throw error;
        }
      },
      
      // Update an existing model using TileDocument directly
      update: async (modelName: string, id: string, data: Record<string, any>) => {
        try {
          console.log(`Updating ${modelName} document ${id} with data:`, data);
          
          // Load the existing document
          // We already imported TileDocument at the top of the file
          try {
            console.log(`Attempting to load document with ID: ${id}`);
            // Add retry logic for document loading
            let retries = 3;
            let doc: any = null;
            
            while (retries > 0) {
              try {
                doc = await TileDocument.load(ceramic, id);
                break; // Successfully loaded
              } catch (loadError) {
                console.warn(`Load attempt failed (${retries} retries left):`, loadError);
                retries--;
                
                // Mark the current node as failed if we've exhausted retries
                if (retries === 0) {
                  // Use the URL we connected with since apiUrl may not be available
                  markNodeAsFailed(ceramicUrl);
                  throw loadError;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            // Safety check - if doc is still null after retries, throw an error
            if (!doc) {
              throw new Error(`Failed to load document ${id} after multiple attempts`);
            }
            
            // Get the current content
            const currentContent = doc.content || {};
            
            // Update the document
            await doc.update({
              ...(currentContent as Record<string, any>),
              ...(data as Record<string, any>),
              updatedAt: new Date().toISOString()
            });
            
            return {
              documentId: id,
              streamId: id,
              ...(doc.content as Record<string, any>)
            };
          } catch (e) {
            console.error(`Document ${id} not found or could not be loaded`, e);
            return null;
          }
          
          console.log(`Successfully updated ${modelName} document:`, id);
          

        } catch (error) {
          console.error(`Error updating ${modelName}:`, error);
          return null;
        }
      },
      
      // Query for models by retrieving all documents of a specific model type
      query: async ({ query, modelName }: { query: string; modelName?: string }) => {
        try {
          // Extract model name from query if not provided
          if (!modelName) {
            const modelNameMatch = query.match(/viewer\s*{\s*(\w+)\s*{/i);
            modelName = modelNameMatch ? modelNameMatch[1].replace(/Index$/, '') : 'Generic';
          }
          
          console.log(`Querying for ${modelName} documents`);
          
          // Get all documents of this model type
          const documents = await composeClient.list(modelName);
          
          // Format the result to match the expected ComposeDB response format
          return {
            data: {
              viewer: {
                [`${modelName}Index`]: {
                  edges: documents.map((doc: Record<string, any>) => ({
                    node: doc
                  }))
                }
              }
            }
          };
        } catch (error) {
          console.error('Error executing query:', error);
          
          // Return empty result on error
          return {
            data: {
              viewer: {
                [`${modelName || 'Generic'}Index`]: {
                  edges: []
                }
              }
            }
          };
        }
      },
      
      // List all documents of a model type
      list: async (modelName: string): Promise<Array<Record<string, any>>> => {
        try {
          console.log(`Listing all ${modelName} documents`);
          
          // First try to get document IDs from localStorage for quick access
          let docIds: string[] = [];
          if (typeof window !== 'undefined') {
            const storageKey = `ceramic-docs-${modelName}`;
            const storedIds = localStorage.getItem(storageKey);
            if (storedIds) {
              docIds = JSON.parse(storedIds);
            }
          }
          
          console.log(`Found ${docIds.length} stored document IDs for ${modelName}`);
          
          // Load each document
          const documents: Array<Record<string, any>> = [];
          for (const id of docIds) {
            try {
              console.log(`Attempting to load document in list with ID: ${id}`);
              let doc: any;
              try {
                doc = await TileDocument.load(ceramic, id);
              } catch (loadError) {
                console.warn(`Failed to load document in list: ${id}`, loadError);
                // Mark the node as potentially failed
                const error = loadError as Error;
                if (error.message && error.message.includes('Load failed')) {
                  // Use the URL we connected with since apiUrl may not be available
                  markNodeAsFailed(ceramicUrl);
                }
                continue; // Skip this document and move to the next one
              }
              // Type-safe check for the deleted property
              const content = doc.content as Record<string, any>;
              if (doc && content && content.deleted !== true) {
                documents.push({
                  documentId: id,
                  streamId: id,
                  ...(doc.content as Record<string, any>)
                });
              }
            } catch (e) {
              console.warn(`Failed to load document ${id}:`, e);
            }
          }
          
          console.log(`Successfully loaded ${documents.length} ${modelName} documents`);
          return documents;
        } catch (error) {
          console.error(`Error listing ${modelName}:`, error);
          return [];
        }
      },
      
      // Delete a document (mark as deleted)
      delete: async (modelName: string, id: string) => {
        try {
          // Load the document
          // We already imported TileDocument at the top of the file
          try {
            const doc = await TileDocument.load(ceramic, id);
            
            // Mark as deleted
            await doc.update({
              ...(doc.content as Record<string, any>),
              deleted: true,
              updatedAt: new Date().toISOString()
            });
            
            return true;
          } catch (e) {
            console.error(`Document ${id} not found or could not be loaded`, e);
            return false;
          }
          

        } catch (error) {
          console.error(`Error deleting ${modelName} document ${id}:`, error);
          return false;
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
    
    try {
      // Try to create the record in ComposeDB
      const result = await client.create(modelName, recordData) as ComposeDBResult;
      
      // Extract the DID from the collection ID
      const did = collectionId.split('_')[1];
      
      // Return the record in our standard format
      const record = {
        id: result.documentId,
        streamId: result.streamId,
        controller: did,
        createdAt: now,
        updatedAt: now,
        content: recordData,
        tags
      };
      
      // Also store in local storage as fallback
      if (typeof window !== 'undefined') {
        try {
          const localStorageKey = `ceramic_record_${collectionId}_${result.documentId}`;
          localStorage.setItem(localStorageKey, JSON.stringify(record));
        } catch (error) {
          console.warn('Failed to store record in local storage:', error);
        }
      }
      
      return record;
    } catch (error) {
      console.error('Failed to create record in ComposeDB:', error);
      
      // Generate a local ID for offline operation
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a local record
      const record = {
        id: localId,
        streamId: `local_stream_${localId}`,
        controller: collectionId.split('_')[1] || 'unknown',
        createdAt: now,
        updatedAt: now,
        content: recordData,
        tags,
        _isLocalOnly: true
      };
      
      // Store in local storage
      if (typeof window !== 'undefined') {
        try {
          const localStorageKey = `ceramic_record_${collectionId}_${localId}`;
          localStorage.setItem(localStorageKey, JSON.stringify(record));
          
          // Also keep track of local-only records for syncing later
          const localOnlyRecords = JSON.parse(localStorage.getItem('ceramic_local_only_records') || '[]');
          localOnlyRecords.push({
            collectionId,
            recordId: localId,
            dataType,
            timestamp: now
          });
          localStorage.setItem('ceramic_local_only_records', JSON.stringify(localOnlyRecords));
        } catch (storageError) {
          console.error('Failed to store record in local storage:', storageError);
        }
      }
      
      return record;
    }
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
