'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useStorage } from './StorageContext';
import { DataType, StorageItem, mapDataTypeToTableType } from '@/types/storage';

// Define the shape of our global data state
type DataState = {
  [key in DataType]?: {
    data: StorageItem[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number;
  }
};

interface DataContextType {
  getData: (dataType: DataType) => StorageItem[];
  isLoading: (dataType: DataType) => boolean;
  error: (dataType: DataType) => string | null;
  refreshData: (dataType: DataType) => Promise<StorageItem[]>;
}

// Create context with default values
const DataContext = createContext<DataContextType>({
  getData: () => [],
  isLoading: () => false,
  error: () => null,
  refreshData: async () => [],
});

// List of all data types we want to preload
const DATA_TYPES: DataType[] = [
  'profile',
  'documents',
  'connections',
  'organizations',
  'digital_assets',
  'real_world_assets',
  'medical',
  'private',
  'contacts',
  'affiliations',
  'currencies',
];

// Throttle duration in milliseconds
const THROTTLE_DURATION = 2000;

// Helper to format TableData into StorageItem[]
const formatItems = (models: any[]): StorageItem[] => {
  return models.map(model => ({
    id: String(model.id),
    key: model.item_key,
    value: model.item_value,
    created_at: model.created_at
  }));
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Reference to the global data state
  const dataStateRef = useRef<DataState>({});
  // State to trigger renders when data changes
  const [dataVersion, setDataVersion] = useState<number>(0);
  
  // Access storage context
  const storage = useStorage();
  const { isReady: storageReady } = storage;
  
  // Reference to last fetch times to implement throttling
  const lastFetchTimeRef = useRef<{[key in DataType]?: number}>({});

  // Initialize data state for all supported types
  useEffect(() => {
    DATA_TYPES.forEach(type => {
      if (!dataStateRef.current[type]) {
        dataStateRef.current[type] = {
          data: [],
          isLoading: false,
          error: null,
          lastFetched: 0,
        };
      }
    });
  }, []);

  // Setup data loading for all data types when storage is ready
  useEffect(() => {
    if (!storageReady) return;
    
    console.log('[DATA CONTEXT] Storage ready, fetching initial data');
    
    // Load data for all types with staggered delays to prevent flooding
    DATA_TYPES.forEach((dataType, index) => {
      // Stagger requests with 100ms between each to prevent overwhelming the system
      const delay = index * 100;
      setTimeout(() => {
        fetchDataForType(dataType).catch(err => {
          console.error(`[DATA CONTEXT] Error loading initial data for ${dataType}:`, err);
        });
      }, delay);
    });
    
  }, [storageReady]);

  // Fetch data for a specific type with necessary type conversions
  const fetchDataForType = async (dataType: DataType): Promise<StorageItem[]> => {
    // Skip if storage isn't ready
    if (!storageReady) {
      console.warn(`[DATA CONTEXT] Cannot fetch ${dataType}, storage not ready`);
      return [];
    }
    
    // Apply throttling
    const now = Date.now();
    const lastFetch = lastFetchTimeRef.current[dataType] || 0;
    if (now - lastFetch < THROTTLE_DURATION) {
      console.log(`[DATA CONTEXT] Throttling fetch for ${dataType}, last fetch ${Math.round((now - lastFetch)/1000)}s ago`);
      // Return current data
      return dataStateRef.current[dataType]?.data || [];
    }
    
    // Update last fetch time
    lastFetchTimeRef.current[dataType] = now;
    
    // Mark data as loading
    dataStateRef.current[dataType] = {
      ...(dataStateRef.current[dataType] || { data: [] }),
      isLoading: true,
      error: null,
      lastFetched: now
    };
    
    // Trigger render with loading state
    setDataVersion(v => v + 1);
    
    try {
      // Use the actual storage implementation
      const tableType = mapDataTypeToTableType(dataType);
      const models = await storage.listItems(tableType);
      
      // Format and store the results
      const formattedItems = formatItems(models);
      
      // Update state with new data
      dataStateRef.current[dataType] = {
        data: formattedItems,
        isLoading: false,
        error: null,
        lastFetched: now,
      };
      
      // Trigger render with updated data
      setDataVersion(v => v + 1);
      
      return formattedItems;
    } catch (error: any) {
      console.error(`[DATA CONTEXT] Error fetching ${dataType}:`, error);
      
      // Update state with error
      dataStateRef.current[dataType] = {
        ...(dataStateRef.current[dataType] || { data: [] }),
        isLoading: false,
        error: error.message || 'Failed to fetch data',
        lastFetched: now,
      };
      
      // Trigger render with error state
      setDataVersion(v => v + 1);
      
      return dataStateRef.current[dataType]?.data || [];
    }
  };

  // Access functions for components
  const getData = (dataType: DataType): StorageItem[] => {
    return dataStateRef.current[dataType]?.data || [];
  };
  
  const isLoading = (dataType: DataType): boolean => {
    return dataStateRef.current[dataType]?.isLoading || false;
  };
  
  const error = (dataType: DataType): string | null => {
    return dataStateRef.current[dataType]?.error || null;
  };
  
  // Refresh data for a specific type
  const refreshData = async (dataType: DataType): Promise<StorageItem[]> => {
    return fetchDataForType(dataType);
  };

  // Context value with access functions
  const contextValue: DataContextType = {
    getData,
    isLoading,
    error,
    refreshData,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Hook for components to consume the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
