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
  getGunInstance: () => Promise<any>; // Expose the Gun instance for direct subscriptions
  isReady: boolean;
}

const StorageContext = createContext<StorageContextType>({ 
  storeItem: async () => ({ id: '', item_key: '', item_value: '', created_at: '' }),
  getItem: async () => null,
  listItems: async () => [],
  deleteItem: async () => false,
  getGunInstance: async () => null,
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
        
        // Test Gun connection by writing and reading a small test value
        // This ensures Gun is actually ready for operations
        const testKey = `test_${Date.now()}`;
        const testValue = 'connection_test';
        
        // Test write operation
        await GunUtils.storeGunItem(TableType.SYSTEM, testKey, testValue);
        
        // Test read operation
        const testResult = await GunUtils.getGunItem(TableType.SYSTEM, testKey);
        
        if (!testResult || testResult.item_value !== testValue) {
          throw new Error('Gun test operation failed - storage not ready');
        }
        
        // If we reach here, Gun is fully initialized and operational
        setIsReady(true);
        
        console.log('[STORAGE] Gun storage system initialized and verified');
      } catch (error) {
        console.error('[STORAGE] Failed to initialize Gun storage:', error);
        // Still set ready to true after a small delay to prevent infinite loading
        // This allows the UI to progress even if Gun has issues
        setTimeout(() => {
          console.log('[STORAGE] Setting storage ready despite initialization issues');
          setIsReady(true);
        }, 3000);
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

  // Add method to get the Gun instance directly for subscriptions
  const getGunInstance = async (): Promise<any> => {
    if (!isReady) {
      throw new Error('Storage not initialized');
    }
    return GunUtils.getGun();
  };

  return (
    <StorageContext.Provider
      value={{
        storeItem,
        getItem,
        listItems,
        deleteItem,
        getGunInstance,
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
