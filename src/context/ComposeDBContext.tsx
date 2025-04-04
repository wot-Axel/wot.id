'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { monitorAsync } from '@/utils/performanceMonitor';
import { DataType } from '@/utils/ceramicUtils';
import { 
  initComposeDB, 
  checkCollectionExists, 
  createCollection,
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  clearCollection
} from '@/composedb/client';
import type { ContentRecord } from '@/types/ceramic';

// Define types for our ComposeDB models
export interface ComposeDBModel {
  id: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// Enhanced context implementation with ComposeDB functionality
interface ComposeDBContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  client: any; // Using any for now until we have proper ComposeDB types
  did: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  createModel: (modelType: DataType, data: any, tags?: string[]) => Promise<ComposeDBModel | null>;
  getModels: (modelType: DataType) => Promise<ComposeDBModel[]>;
  updateModel: (modelType: DataType, id: string, data: any, tags?: string[]) => Promise<ComposeDBModel | null>;
  deleteModel: (modelType: DataType, id: string) => Promise<boolean>;
}

const ComposeDBContext = createContext<ComposeDBContextType>({
  isInitialized: false,
  isLoading: false,
  error: null,
  client: null,
  did: null,
  connect: async () => {},
  disconnect: () => {},
  createModel: async () => null,
  getModels: async () => [],
  updateModel: async () => null,
  deleteModel: async () => false
});

export const useComposeDB = () => useContext(ComposeDBContext);

export const ComposeDBProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAppKitAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [did, setDid] = useState<string | null>(null);
  
  // Initialize ComposeDB when the user connects their wallet
  useEffect(() => {
    if (isConnected && address && !isInitialized && !isLoading) {
      connect();
    }
  }, [isConnected, address, isInitialized, isLoading]);
  
  // Connect to ComposeDB
  const connect = async () => {
    if (isLoading || isInitialized || !address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Connecting to ComposeDB...');
      
      // Initialize ComposeDB client
      const composeClient = await initComposeDB();
      
      // Set the DID based on the connected wallet
      const userDid = `did:key:${address}`;
      
      setClient(composeClient);
      setDid(userDid);
      setIsInitialized(true);
      console.log('Connected to ComposeDB with DID:', userDid);
    } catch (err) {
      console.error('Error connecting to ComposeDB:', err);
      setError(err instanceof Error ? err.message : 'Unknown error connecting to ComposeDB');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from ComposeDB
  const disconnect = () => {
    if (client && client.ceramic && client.ceramic.disconnect) {
      client.ceramic.disconnect();
    }
    setClient(null);
    setDid(null);
    setIsInitialized(false);
    console.log('Disconnected from ComposeDB');
  };
  
  // Create a new model in ComposeDB
  const createModel = async (
    modelType: DataType, 
    data: any,
    tags?: string[]
  ): Promise<ComposeDBModel | null> => {
    return monitorAsync('createModel', 'composedb', async () => {
      if (!isInitialized || !did) {
        console.error('ComposeDB not initialized');
        return null;
      }
      
      try {
        // Check if collection exists, create if not
        const { collectionId } = await checkCollectionExists(modelType, did);
        
        // Create the record
        const record = await createRecord(
          modelType,
          collectionId,
          data,
          tags || []
        );
        
        // Return in the expected format
        return {
          id: record.id,
          content: record.content,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.tags
        };
      } catch (error) {
        console.error('Error creating model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error creating model');
        return null;
      }
    });
  };
  
  // Get all models of a specific type
  const getModels = async (modelType: DataType): Promise<ComposeDBModel[]> => {
    return monitorAsync('getModels', 'composedb', async () => {
      if (!isInitialized || !did) {
        console.error('ComposeDB not initialized');
        return [];
      }
      
      try {
        // Check if collection exists
        const { exists, collectionId } = await checkCollectionExists(modelType, did);
        
        if (!exists) {
          // Create the collection if it doesn't exist
          await createCollection(modelType, did);
          return [];
        }
        
        // Get all records
        const records = await getRecords(collectionId);
        
        // Return in the expected format
        return records.map(record => ({
          id: record.id,
          content: record.content,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.tags
        }));
      } catch (error) {
        console.error('Error getting models:', error);
        setError(error instanceof Error ? error.message : 'Unknown error getting models');
        return [];
      }
    });
  };
  
  // Update a model
  const updateModel = async (
    modelType: DataType, 
    id: string, 
    data: any,
    tags?: string[]
  ): Promise<ComposeDBModel | null> => {
    return monitorAsync('updateModel', 'composedb', async () => {
      if (!isInitialized || !did) {
        console.error('ComposeDB not initialized');
        return null;
      }
      
      try {
        // Get the collection ID
        const { collectionId } = await checkCollectionExists(modelType, did);
        
        // Update the record
        const record = await updateRecord(
          modelType,
          collectionId,
          id,
          data,
          tags
        );
        
        if (!record) {
          return null;
        }
        
        // Return in the expected format
        return {
          id: record.id,
          content: record.content,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.tags
        };
      } catch (error) {
        console.error('Error updating model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error updating model');
        return null;
      }
    });
  };
  
  // Delete a model
  const deleteModel = async (modelType: DataType, id: string): Promise<boolean> => {
    return monitorAsync('deleteModel', 'composedb', async () => {
      if (!isInitialized || !did) {
        console.error('ComposeDB not initialized');
        return false;
      }
      
      try {
        // Get the collection ID
        const { collectionId } = await checkCollectionExists(modelType, did);
        
        // Delete the record
        return await deleteRecord(collectionId, id);
      } catch (error) {
        console.error('Error deleting model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error deleting model');
        return false;
      }
    });
  };
  

  
  return (
    <ComposeDBContext.Provider
      value={{
        isInitialized,
        isLoading,
        error,
        client,
        did,
        connect,
        disconnect,
        createModel,
        getModels,
        updateModel,
        deleteModel
      }}
    >
      {children}
    </ComposeDBContext.Provider>
  );
};
