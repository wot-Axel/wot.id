'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TableType, TableData } from '@/utils/storageUtils';
import { DataType } from '@/types/storage';
import { CeramicDataService } from '@/ceramic/ceramicDataService';
import { useCeramic } from './CeramicContext';

// Internal utility to map TableType to DataType
function mapTableTypeToDataType(tableType: string): DataType {
  switch(tableType) {
    case 'profile':
      return DataType.PROFILE;
    case 'documents':
      return DataType.DOCUMENTS;
    case 'digital_assets':
      return DataType.DIGITAL_ASSETS;
    case 'connections':
      return DataType.CONNECTIONS;
    case 'organizations':
      return DataType.ORGANIZATIONS;
    default:
      return DataType.DEFAULT;
  }
}

// Define the storage context interface
interface StorageContextType {
  storeItem: (tableType: TableType, key: string, value: string) => Promise<TableData>;
  getItem: (tableType: TableType, key: string) => Promise<TableData | null>;
  listItems: (tableType: TableType) => Promise<TableData[]>;
  deleteItem: (tableType: TableType, key: string) => Promise<boolean>;
  isReady: boolean;
}

const StorageContext = createContext<StorageContextType>({ 
  storeItem: async () => ({ id: '', item_key: '', item_value: '', created_at: '' }),
  getItem: async () => null,
  listItems: async () => [],
  deleteItem: async () => false,
  isReady: false 
});

export const StorageProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [ceramicService, setCeramicService] = useState<CeramicDataService | null>(null);
  
  // Get Ceramic context
  const { ceramic, composeClient, isAuthenticated, isReady: ceramicReady } = useCeramic();

  // Initialize storage when the provider mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
          // Get wallet address from localStorage if available
          const storedAddress = localStorage.getItem('userAddress') || '';
          setAddress(storedAddress);
          
          // Mark storage as ready even if Ceramic isn't ready yet
          // This allows the app to function while Ceramic initializes
          setIsReady(true);
          console.log('[STORAGE] Storage system initialized');
        } else {
          console.log('[STORAGE] Not in browser environment, storage unavailable');
          // Still set ready to allow SSR rendering
          setIsReady(true);
        }
      } catch (error) {
        console.error('[STORAGE] Failed to initialize storage:', error);
        // Still set ready to true to prevent infinite loading
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // Update address when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userAddress') {
        setAddress(event.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Initialize CeramicDataService when Ceramic and ComposeDB are ready
  useEffect(() => {
    if (ceramicReady && composeClient && ceramic) {
      const service = new CeramicDataService(composeClient, ceramic.did);
      setCeramicService(service);
      console.log('[STORAGE] Ceramic storage service initialized');
    }
  }, [ceramicReady, composeClient, ceramic, isAuthenticated]);
  
  // Update DID in service when authentication changes
  useEffect(() => {
    if (ceramicService && ceramic && ceramic.did && isAuthenticated) {
      ceramicService.setDID(ceramic.did);
      console.log('[STORAGE] Updated DID in Ceramic service');
    }
  }, [ceramicService, ceramic, isAuthenticated]);

  // Storage implementation with Ceramic
  const storeItem = async (tableType: TableType, key: string, value: string): Promise<TableData> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }

    // Make sure we have a valid address
    const currentAddress = address || localStorage.getItem('userAddress') || '';
    if (!currentAddress) {
      throw new Error('No wallet address available');
    }
    
    // If Ceramic is ready, use it
    if (ceramicService && isAuthenticated) {
      try {
        // Map TableType to DataType
        const dataType = mapTableTypeToDataType(tableType);
        
        // Store in Ceramic
        const result = await ceramicService.storeItem(dataType, key, value);
        return {
          id: result.id,
          item_key: result.key,
          item_value: result.value,
          created_at: result.created_at || new Date().toISOString()
        };
      } catch (error) {
        console.error('[STORAGE] Ceramic storage error:', error);
        // Fall back to localStorage for resilience
        console.log('[STORAGE] Falling back to localStorage');
      }
    }
    
    // Fall back to localStorage
    // Store in localStorage for now as a fallback
    const item = {
      id: Date.now().toString(),
      item_key: key,
      item_value: value,
      created_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const localStorageKey = `wot_id_fallback_${tableType}_${key}`;
    localStorage.setItem(localStorageKey, JSON.stringify(item));
    
    return item;
  };

  const getItem = async (tableType: TableType, key: string): Promise<TableData | null> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }

    // Make sure we have a valid address
    const currentAddress = address || localStorage.getItem('userAddress') || '';
    if (!currentAddress) {
      return null;
    }
    
    // If Ceramic is ready, use it
    if (ceramicService && isAuthenticated) {
      try {
        // Map TableType to DataType
        const dataType = mapTableTypeToDataType(tableType);
        
        // Get from Ceramic
        let result = await ceramicService.getItem(dataType, key);
        if (result) {
          return {
            id: result.id,
            item_key: result.key,
            item_value: result.value,
            created_at: result.created_at || new Date().toISOString()
          };
        }
        // If not found in Ceramic, continue to localStorage fallback
      } catch (error) {
        console.error('[STORAGE] Ceramic retrieval error:', error);
        // Fall back to localStorage for resilience
        console.log('[STORAGE] Falling back to localStorage');
      }
    }
    
    // Fall back to localStorage
    const localStorageKey = `wot_id_fallback_${tableType}_${key}`;
    const storedItem = localStorage.getItem(localStorageKey);
    
    if (storedItem) {
      try {
        return JSON.parse(storedItem) as TableData;
      } catch (e) {
        console.error('[STORAGE] Error parsing localStorage item:', e);
      }
    }
    
    return null;
  };

  const listItems = async (tableType: TableType): Promise<TableData[]> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }

    // Make sure we have a valid address
    const currentAddress = address || localStorage.getItem('userAddress') || '';
    if (!currentAddress) {
      return [];
    }
    
    // If Ceramic is ready, use it
    if (ceramicService && isAuthenticated) {
      try {
        // Map TableType to DataType
        const dataType = mapTableTypeToDataType(tableType);
        
        // List from Ceramic
        const results = await ceramicService.listItems(dataType);
        return results.map(result => ({
          id: result.id,
          item_key: result.key,
          item_value: result.value,
          created_at: result.created_at || new Date().toISOString()
        }));
      } catch (error) {
        console.error('[STORAGE] Ceramic list error:', error);
        // Fall back to localStorage for resilience
        console.log('[STORAGE] Falling back to localStorage');
      }
    }
    
    // Get all items from localStorage that match the pattern
    const fallbackItems: TableData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(`wot_id_fallback_${tableType}_`)) {
        try {
          const storedItem = localStorage.getItem(storageKey);
          if (storedItem) {
            fallbackItems.push(JSON.parse(storedItem) as TableData);
          }
        } catch (e) {
          console.error('[STORAGE] Error parsing localStorage item:', e);
        }
      }
    }
    
    return fallbackItems;
  };

  const deleteItem = async (tableType: TableType, key: string): Promise<boolean> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }

    // Make sure we have a valid address
    const currentAddress = address || localStorage.getItem('userAddress') || '';
    if (!currentAddress) {
      return false;
    }
    
    // If Ceramic is ready, use it
    if (ceramicService && isAuthenticated) {
      try {
        // Map TableType to DataType
        const dataType = mapTableTypeToDataType(tableType);
        
        // Delete from Ceramic
        const success = await ceramicService.deleteItem(dataType, key);
        if (success) {
          // Also remove from localStorage fallback if it exists
          const localStorageKey = `wot_id_fallback_${tableType}_${key}`;
          localStorage.removeItem(localStorageKey);
          return true;
        }
      } catch (error) {
        console.error('[STORAGE] Ceramic deletion error:', error);
        // Fall back to localStorage for resilience
        console.log('[STORAGE] Falling back to localStorage');
      }
    }
    
    const localStorageKey = `wot_id_fallback_${tableType}_${key}`;
    localStorage.removeItem(localStorageKey);
    return true;
  };

  const mapTableTypeToDataType = (tableType: TableType) => {
    const { DataType } = require('@/types/storage');

    switch (tableType) {
      case TableType.PRIVATE:
        return DataType.PRIVATE;
      case TableType.CONTACTS:
        return DataType.CONTACTS;
      case TableType.DIGITAL_ASSETS:
        return DataType.DIGITAL_ASSETS; 
      case TableType.MEDICAL:
        return DataType.MEDICAL;
      case TableType.AFFILIATIONS:
        return DataType.AFFILIATIONS;
      case TableType.MESSAGE:
        return DataType.MESSAGES;
      case TableType.SYSTEM:
        return DataType.PRIVATE; // System data goes to private storage
      default:
        return DataType.PRIVATE;
    }
  };

  // Context provider value
  const contextValue: StorageContextType = {
    storeItem,
    getItem,
    listItems,
    deleteItem,
    isReady
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
