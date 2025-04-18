'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useStorage } from './StorageContext';
import { DataType, StorageItem } from '../types/storage';
import { mapDataTypeToTableType } from '../types/storage';

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
  DataType.PROFILE,
  DataType.DOCUMENTS,
  DataType.CONNECTIONS,
  DataType.ORGANIZATIONS,
  DataType.DIGITAL_ASSETS,
  DataType.REAL_WORLD_ASSETS,
  DataType.MEDICAL,
  DataType.PRIVATE,
  DataType.CONTACTS,
  DataType.AFFILIATIONS,
  DataType.CURRENCIES,
];

// Throttle duration in milliseconds - different for various data types
const DEFAULT_THROTTLE_DURATION = 3000; // Default 3 seconds

// Configure longer throttle times for less critical data types
const THROTTLE_DURATIONS: Partial<Record<DataType, number>> = {
  profile: 2000,           // More critical data - update more frequently
  documents: 5000,
  connections: 5000,
  organizations: 5000,
  digital_assets: 3000,
  real_world_assets: 5000,
  medical: 10000,
  private: 5000,
  contacts: 5000,
  affiliations: 10000,
  currencies: 3000,
  messages: 3000,       // Added missing type
};

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
    
    // Group data types by priority for better loading experience
    const priorityData: DataType[] = ['profile', 'connections', 'currencies']; // Load these first
    const secondaryData: DataType[] = DATA_TYPES.filter(type => !priorityData.includes(type));
    
    // Load priority data first
    priorityData.forEach((dataType, index) => {
      const delay = index * 150; // Slightly longer delay between priority items
      setTimeout(() => {
        fetchDataForType(dataType).catch(err => {
          console.error(`[DATA CONTEXT] Error loading initial data for ${dataType}:`, err);
        });
      }, delay);
    });
    
    // Then load secondary data with larger staggering to reduce load spikes
    secondaryData.forEach((dataType, index) => {
      const delay = 800 + (index * 300); // Start after priority data with more spacing
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
    
    // Apply throttling with different durations for different data types
    const now = Date.now();
    const lastFetch = lastFetchTimeRef.current[dataType] || 0;
    const throttleDuration = THROTTLE_DURATIONS[dataType] || DEFAULT_THROTTLE_DURATION;
    
    if (now - lastFetch < throttleDuration) {
      // Only log in development to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DATA CONTEXT] Throttling fetch for ${dataType}, last fetch ${Math.round((now - lastFetch)/1000)}s ago`);
      }
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
