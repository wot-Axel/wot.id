'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Database, DataType, initCeramic } from '@/utils/ceramicUtils';

// Define types for our Ceramic models
export interface CeramicModel {
  id: string;
  key?: string;
  value: string;
  createdAt?: number;
  updatedAt?: number;
}

// Enhanced context implementation with Ceramic functionality
interface CeramicContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  ceramic: Database | null;
  did: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  createModel: (modelType: string, data: any) => Promise<CeramicModel | null>;
  getModels: (modelType: string) => Promise<CeramicModel[]>;
  updateModel: (modelType: string, id: string, data: any) => Promise<CeramicModel | null>;
  deleteModel: (modelType: string, id: string) => Promise<boolean>;
}

const CeramicContext = createContext<CeramicContextType>({
  isInitialized: false,
  isLoading: false,
  error: null,
  ceramic: null,
  did: null,
  connect: async () => {},
  disconnect: () => {},
  createModel: async () => null,
  getModels: async () => [],
  updateModel: async () => null,
  deleteModel: async () => false
});

export const useCeramic = () => useContext(CeramicContext);

export const CeramicProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAppKitAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceramic, setCeramic] = useState<Database | null>(null);
  const [did, setDid] = useState<string | null>(null);
  
  // Initialize Ceramic when the user connects their wallet
  useEffect(() => {
    if (isConnected && address && !isInitialized && !isLoading) {
      connect();
    }
  }, [isConnected, address, isInitialized, isLoading]);
  
  // Connect to Ceramic network
  const connect = async () => {
    if (isLoading || isInitialized || !address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Connecting to Ceramic network...');
      
      // Initialize Ceramic with the user's wallet
      const { db, did: userDid } = await initCeramic(window.ethereum, address);
      
      setCeramic(db);
      setDid(userDid);
      setIsInitialized(true);
      console.log('Connected to Ceramic network with DID:', userDid);
    } catch (err) {
      console.error('Error connecting to Ceramic:', err);
      setError(err instanceof Error ? err.message : 'Unknown error connecting to Ceramic');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from Ceramic network
  const disconnect = () => {
    if (ceramic) {
      ceramic.disconnect();
    }
    setCeramic(null);
    setDid(null);
    setIsInitialized(false);
    console.log('Disconnected from Ceramic network');
  };
  
  // Create a new model in Ceramic
  const createModel = async (modelType: string, data: any): Promise<CeramicModel | null> => {
    if (!isInitialized) {
      setError('Ceramic not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, we would create a new document in Ceramic
      // For now, we're just simulating the creation
      console.log(`Creating ${modelType} model in Ceramic:`, data);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      const model: CeramicModel = {
        id: `ceramic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        key: data.key || 'default',
        value: typeof data === 'string' ? data : JSON.stringify(data),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      return model;
    } catch (err) {
      console.error(`Error creating ${modelType} model:`, err);
      setError(err instanceof Error ? err.message : `Error creating ${modelType} model`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get models from Ceramic
  const getModels = async (modelType: string): Promise<CeramicModel[]> => {
    if (!isInitialized) {
      setError('Ceramic not initialized');
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, we would query Ceramic for documents
      // For now, we're just returning an empty array
      console.log(`Getting ${modelType} models from Ceramic`);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      return [];
    } catch (err) {
      console.error(`Error getting ${modelType} models:`, err);
      setError(err instanceof Error ? err.message : `Error getting ${modelType} models`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a model in Ceramic
  const updateModel = async (modelType: string, id: string, data: any): Promise<CeramicModel | null> => {
    if (!isInitialized) {
      setError('Ceramic not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, we would update a document in Ceramic
      // For now, we're just simulating the update
      console.log(`Updating ${modelType} model ${id} in Ceramic:`, data);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      const model: CeramicModel = {
        id,
        key: data.key || 'default',
        value: typeof data === 'string' ? data : JSON.stringify(data),
        updatedAt: Date.now()
      };
      
      return model;
    } catch (err) {
      console.error(`Error updating ${modelType} model:`, err);
      setError(err instanceof Error ? err.message : `Error updating ${modelType} model`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a model from Ceramic
  const deleteModel = async (modelType: string, id: string): Promise<boolean> => {
    if (!isInitialized) {
      setError('Ceramic not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, we would delete a document from Ceramic
      // For now, we're just simulating the deletion
      console.log(`Deleting ${modelType} model ${id} from Ceramic`);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      return true;
    } catch (err) {
      console.error(`Error deleting ${modelType} model:`, err);
      setError(err instanceof Error ? err.message : `Error deleting ${modelType} model`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <CeramicContext.Provider value={{
      isInitialized,
      isLoading,
      error,
      ceramic,
      did,
      connect,
      disconnect,
      createModel,
      getModels,
      updateModel,
      deleteModel
    }}>
      {children}
    </CeramicContext.Provider>
  );
};
