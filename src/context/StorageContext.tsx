'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TableType, TableData } from '@/utils/storageUtils';
import { 
  generateLocalTableName, 
  checkLocalTableExists, 
  createLocalTable, 
  insertLocalData, 
  getLocalData, 
  clearLocalData 
} from '@/utils/localStorageUtils';

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

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');

  // Initialize localStorage when the provider mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
          // Get wallet address from localStorage if available
          const storedAddress = localStorage.getItem('userAddress') || '';
          setAddress(storedAddress);
          
          // Mark storage as ready
          setIsReady(true);
          console.log('[STORAGE] Local storage system initialized and verified');
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

  // Implement storage functions with localStorage
  const storeItem = async (tableType: TableType, key: string, value: string): Promise<TableData> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }

    // Make sure we have a valid address
    const currentAddress = address || localStorage.getItem('userAddress') || '';
    if (!currentAddress) {
      throw new Error('No wallet address available');
    }

    // Check if table exists, create if not
    const { exists, tableName } = checkLocalTableExists(tableType, currentAddress);
    const finalTableName = exists ? tableName : createLocalTable(tableType, currentAddress);

    // Insert data
    insertLocalData(finalTableName, key, value);

    return { 
      id: Date.now().toString(), 
      item_key: key, 
      item_value: value, 
      created_at: new Date().toISOString() 
    };
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

    // Check if table exists
    const { exists, tableName } = checkLocalTableExists(tableType, currentAddress);
    if (!exists) {
      return null;
    }

    // Get all data and find matching item
    const items = getLocalData(tableName);
    const item = items.find(item => item.key === key);
    
    if (!item) {
      return null;
    }

    return {
      id: item.id?.toString() || '',
      item_key: item.key,
      item_value: item.value,
      created_at: item.created_at || new Date().toISOString()
    };
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

    // Check if table exists
    const { exists, tableName } = checkLocalTableExists(tableType, currentAddress);
    if (!exists) {
      console.log(`[STORAGE] Final resolver with 0 items for ${tableType}`);
      return [];
    }

    // Get all data and format for consistency
    const items = getLocalData(tableName);
    console.log(`[STORAGE] Final resolver with ${items.length} items for ${tableType}`);
    
    return items.map(item => ({
      id: item.id?.toString() || '',
      item_key: item.key,
      item_value: item.value,
      created_at: item.created_at || new Date().toISOString()
    }));
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

    // Check if table exists
    const { exists, tableName } = checkLocalTableExists(tableType, currentAddress);
    if (!exists) {
      return false;
    }

    // Get current data
    const items = getLocalData(tableName);
    const filteredItems = items.filter(item => item.key !== key);
    
    // Only update if we found and removed the item
    if (filteredItems.length < items.length) {
      // Save filtered data back
      localStorage.setItem(tableName, JSON.stringify(filteredItems));
      return true;
    }
    
    return false;
  };

  return (
    <StorageContext.Provider
      value={{
        storeItem,
        getItem,
        listItems,
        deleteItem,
        isReady
      }}
    >
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
