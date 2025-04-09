'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as GunUtils from '@/utils/gunUtils';
import { TableType, TableData } from '@/utils/storageUtils';

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

  // Initialize Gun when the provider mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Gun
        GunUtils.initGun();
        
        // Set ready state
        setIsReady(true);
        
        console.log('[STORAGE] Gun storage system initialized');
      } catch (error) {
        console.error('[STORAGE] Failed to initialize Gun storage:', error);
        setIsReady(false);
      }
    };

    initialize();
  }, []);

  // Implement storage functions with Gun.js
  const storeItem = async (tableType: TableType, key: string, value: string): Promise<TableData> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }
    return await GunUtils.storeGunItem(tableType, key, value);
  };

  const getItem = async (tableType: TableType, key: string): Promise<TableData | null> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }
    return await GunUtils.getGunItem(tableType, key);
  };

  const listItems = async (tableType: TableType): Promise<TableData[]> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }
    return await GunUtils.listGunItems(tableType);
  };

  const deleteItem = async (tableType: TableType, key: string): Promise<boolean> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }
    return await GunUtils.deleteGunItem(tableType, key);
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
