/**
 * Ceramic Context Provider
 * 
 * Provides a React context for managing Ceramic client state and connections
 * with multi-node fallback support and proper DID persistence.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  initCeramic, 
  resetCeramicNodes, 
  getCeramicStatus,
  CeramicClient,
  DataType,
  ContentRecord,
  CollectionInfo,
  checkCollectionExists,
  createCollection,
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  ensureCollection,
  getRecordsByType
} from '@/composedb/ceramic';

// Interface for the Ceramic context
interface CeramicContextType {
  // Connection state
  client: CeramicClient | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
  
  // Connection management
  connect: (identity?: string) => Promise<void>;
  disconnect: () => void;
  resetNodes: () => void;
  getStatus: () => { lastSuccessfulNode: string | null; failedNodes: string[] };
  
  // Data operations
  ensureCollection: (dataType: DataType, did: string) => Promise<string>;
  addRecord: (dataType: DataType, did: string, content: any, tags?: string[]) => Promise<ContentRecord>;
  getRecords: (dataType: DataType, did: string) => Promise<ContentRecord[]>;
  getRecordsByType: (client: CeramicClient, dataType: DataType, did: string) => Promise<ContentRecord[]>;
  updateRecord: (dataType: DataType, did: string, recordId: string, content: any, tags?: string[]) => Promise<ContentRecord | null>;
  deleteRecord: (dataType: DataType, did: string, recordId: string) => Promise<boolean>;
}

// Create the context with default values
const CeramicContext = createContext<CeramicContextType>({
  client: null,
  isConnecting: false,
  isConnected: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  resetNodes: () => {},
  getStatus: () => ({ lastSuccessfulNode: null, failedNodes: [] }),
  ensureCollection: async () => '',
  addRecord: async () => ({ id: '', streamId: '', controller: '', createdAt: '', updatedAt: '', content: {} }),
  getRecordsByType: async () => [],
  getRecords: async () => [],
  updateRecord: async () => null,
  deleteRecord: async () => false
});

// Provider props interface
interface CeramicProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  identity?: string;
}

/**
 * Ceramic Provider Component
 */
export const CeramicProvider: React.FC<CeramicProviderProps> = ({ 
  children, 
  autoConnect = true,
  identity
}) => {
  const [client, setClient] = useState<CeramicClient | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Connect to Ceramic network
  const connect = async (userIdentity?: string): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Use provided identity or fall back to the one from props
      const identityToUse = userIdentity || identity;
      
      // Initialize Ceramic client with multi-node fallback
      const ceramicClient = await initCeramic(identityToUse);
      
      setClient(ceramicClient);
      setIsConnected(!ceramicClient.isOffline);
      
      if (ceramicClient.isOffline) {
        console.warn('Connected in offline mode. Some features may be limited.');
      }
    } catch (err) {
      console.error('Failed to connect to Ceramic:', err);
      setError(err instanceof Error ? err : new Error('Unknown error connecting to Ceramic'));
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from Ceramic network
  const disconnect = (): void => {
    setClient(null);
    setIsConnected(false);
  };

  // Reset failed nodes
  const resetNodes = (): void => {
    resetCeramicNodes();
  };

  // Get connection status
  const getStatus = () => {
    return getCeramicStatus();
  };

  // Ensure a collection exists for a data type and DID
  const ensureCollection = async (dataType: DataType, did: string): Promise<string> => {
    if (!client) throw new Error('Ceramic client not initialized');
    
    // Check if collection exists
    const { exists, collectionId } = await checkCollectionExists(client, dataType, did);
    
    // Create collection if it doesn't exist
    if (!exists) {
      await createCollection(client, dataType, did);
    }
    
    return collectionId;
  };

  // Add a record to a collection
  const addRecord = async (
    dataType: DataType, 
    did: string, 
    content: any, 
    tags?: string[]
  ): Promise<ContentRecord> => {
    if (!client) throw new Error('Ceramic client not initialized');
    
    // Ensure collection exists
    const collectionId = await ensureCollection(dataType, did);
    
    // Create the record
    return createRecord(client, dataType, collectionId, content, tags);
  };

  // Get records from a collection
  const getRecordsFromCollection = async (
    dataType: DataType, 
    did: string
  ): Promise<ContentRecord[]> => {
    if (!client) throw new Error('Ceramic client not initialized');
    
    // Ensure collection exists
    const collectionId = await ensureCollection(dataType, did);
    
    // Get the records
    return getRecords(client, collectionId);
  };

  // Update a record in a collection
  const updateRecordInCollection = async (
    dataType: DataType, 
    did: string, 
    recordId: string, 
    content: any, 
    tags?: string[]
  ): Promise<ContentRecord | null> => {
    if (!client) throw new Error('Ceramic client not initialized');
    
    // Ensure collection exists
    const collectionId = await ensureCollection(dataType, did);
    
    // Update the record
    return updateRecord(client, dataType, collectionId, recordId, content, tags);
  };

  // Delete a record from a collection
  const deleteRecordFromCollection = async (
    dataType: DataType, 
    did: string, 
    recordId: string
  ): Promise<boolean> => {
    if (!client) throw new Error('Ceramic client not initialized');
    
    // Ensure collection exists
    const collectionId = await ensureCollection(dataType, did);
    
    // Delete the record
    return deleteRecord(client, collectionId, recordId);
  };

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Implement getRecordsByType function
  const getRecordsByTypeImpl = async (client: CeramicClient, dataType: DataType, did: string): Promise<ContentRecord[]> => {
    if (!client) {
      throw new Error('Ceramic client not initialized');
    }
    
    // Use the imported getRecordsByType function from ceramic.ts
    return getRecordsByType(client, dataType, did);
  };

  // Context value
  const value: CeramicContextType = {
    client,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    resetNodes,
    getStatus,
    ensureCollection,
    addRecord,
    getRecords: getRecordsFromCollection,
    getRecordsByType: getRecordsByTypeImpl,
    updateRecord: updateRecordInCollection,
    deleteRecord: deleteRecordFromCollection
  };

  return (
    <CeramicContext.Provider value={value}>
      {children}
    </CeramicContext.Provider>
  );
};

/**
 * Hook to use the Ceramic context
 */
export const useCeramic = (): CeramicContextType => {
  const context = useContext(CeramicContext);
  
  if (context === undefined) {
    throw new Error('useCeramic must be used within a CeramicProvider');
  }
  
  return context;
};

export default CeramicContext;
