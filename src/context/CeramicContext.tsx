'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { DataType, initCeramic as initCeramicUtil } from '@/utils/ceramicUtils';

// Define the context type
interface CeramicContextType {
  ceramic: any | null;
  compose: any | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initCeramic: () => Promise<void>;
  checkCollectionExists: (dataType: DataType) => Promise<{ exists: boolean; collectionId: string }>;
  createCollection: (dataType: DataType) => Promise<{ collectionId: string }>;
  getData: (dataType: DataType, collectionId: string) => Promise<any[]>;
  insertData: (dataType: DataType, collectionId: string, data: any) => Promise<any>;
  clearData: (dataType: DataType, collectionId: string) => Promise<boolean>;
}

// Create the context with default values
const CeramicContext = createContext<CeramicContextType>({
  ceramic: null,
  compose: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  initCeramic: async () => {},
  checkCollectionExists: async () => ({ exists: false, collectionId: '' }),
  createCollection: async () => ({ collectionId: '' }),
  getData: async () => [],
  insertData: async () => ({}),
  clearData: async () => false
});

// Provider component
export const CeramicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAppKitAccount();
  const [ceramic, setCeramic] = useState<any | null>(null);
  const [compose, setCompose] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Ceramic when the user connects their wallet
  useEffect(() => {
    if (isConnected && address && !isInitialized && !isLoading) {
      initCeramic();
    }
  }, [isConnected, address, isInitialized, isLoading]);

  // Initialization function
  const initCeramic = async () => {
    try {
      setIsLoading(true);
      
      if (!address) {
        throw new Error('No wallet address available');
      }
      
      // Initialize Ceramic using the utility function
      const { ceramic: ceramicClient, compose: composeClient } = await initCeramicUtil(
        window.ethereum,
        address
      );
      
      setCeramic(ceramicClient);
      setCompose(composeClient);
      setIsInitialized(true);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize Ceramic: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  };

  // Collection management functions
  const checkCollectionExists = async (dataType: DataType) => {
    if (!ceramic || !isInitialized) {
      throw new Error('Ceramic not initialized');
    }
    
    const did = ceramic.did?.id;
    if (!did) {
      throw new Error('No DID available');
    }
    
    return await import('@/utils/ceramicUtils').then(({ checkCollectionExists }) => 
      checkCollectionExists(ceramic, dataType, did)
    );
  };
  
  const createCollection = async (dataType: DataType) => {
    if (!ceramic || !isInitialized) {
      throw new Error('Ceramic not initialized');
    }
    
    const did = ceramic.did?.id;
    if (!did) {
      throw new Error('No DID available');
    }
    
    return await import('@/utils/ceramicUtils').then(({ createCollection }) => 
      createCollection(ceramic, dataType, did)
    );
  };
  
  const getData = async (dataType: DataType, collectionId: string) => {
    if (!ceramic || !isInitialized) {
      throw new Error('Ceramic not initialized');
    }
    
    return await import('@/utils/ceramicUtils').then(({ getRecords }) => 
      getRecords(ceramic, dataType, collectionId)
    );
  };
  
  const insertData = async (dataType: DataType, collectionId: string, data: any) => {
    if (!ceramic || !isInitialized) {
      throw new Error('Ceramic not initialized');
    }
    
    return await import('@/utils/ceramicUtils').then(({ createRecord }) => 
      createRecord(ceramic, dataType, collectionId, data)
    );
  };
  
  const clearData = async (dataType: DataType, collectionId: string) => {
    if (!ceramic || !isInitialized) {
      throw new Error('Ceramic not initialized');
    }
    
    await import('@/utils/ceramicUtils').then(({ clearCollection }) => 
      clearCollection(ceramic, dataType, collectionId)
    );
    
    return true;
  };

  return (
    <CeramicContext.Provider
      value={{
        ceramic,
        compose,
        isInitialized,
        isLoading,
        error,
        initCeramic,
        checkCollectionExists,
        createCollection,
        getData,
        insertData,
        clearData
      }}
    >
      {children}
    </CeramicContext.Provider>
  );
};

// Custom hook to use the Ceramic context
export const useCeramic = () => useContext(CeramicContext);
