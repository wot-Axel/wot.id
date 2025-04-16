 'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType, TableData, PrivateData } from '@/utils/storageUtils';

/**
 * Hook for accessing data from storage
 * This provides a consistent interface for all data types
 */

// Define DataType enum to maintain compatibility with existing components
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  CONNECTIONS = 'connections',
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}

// Map DataType to TableType
const mapDataTypeToTableType = (dataType: DataType): TableType => {
  switch (dataType) {
    case DataType.PROFILE:
      return TableType.PRIVATE;
    case DataType.DOCUMENTS:
      return TableType.PRIVATE;
    case DataType.DIGITAL_ASSETS:
      return TableType.DIGITAL_ASSETS;
    case DataType.REAL_WORLD_ASSETS:
      return TableType.PRIVATE;
    case DataType.MEDICAL:
      return TableType.MEDICAL;
    case DataType.CONNECTIONS:
      return TableType.CONTACTS;
    case DataType.ORGANIZATIONS:
      return TableType.AFFILIATIONS;
    case DataType.MESSAGES:
      return TableType.MESSAGE;
    case DataType.PRIVATE:
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};

// Import the useData hook from DataContext
import { useData } from '@/context/DataContext';

export const useDataAccess = (dataType: DataType) => {
  // Get direct access to the centralized data store
  const { getData, isLoading: getIsLoading, error: getError, refreshData: refreshCentralData } = useData();
  const storage = useStorage();
  
  // Local state to maintain the existing API
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep local state in sync with the centralized store
  useEffect(() => {
    // Get data from the centralized store
    const centralData = getData(dataType as any);
    const centralIsLoading = getIsLoading(dataType as any);
    const centralError = getError(dataType as any);
    
    // Update local state to match
    setData(centralData);
    setIsLoading(centralIsLoading);
    setError(centralError);
  }, [dataType, getData, getIsLoading, getError]);
  
  // Delegate to the central data store's refresh function
  const fetchData = async () => {
    if (!storage.isReady) {
      console.warn(`[DATA ACCESS] Storage not ready for ${dataType}`);
      return [];
    }
    
    try {
      // Use the central data store's refresh function
      const result = await refreshCentralData(dataType as any);
      return result;
    } catch (err) {
      console.error(`Error fetching ${dataType} data:`, err);
      return [];
    }
  };
  
  // Create a new item - keep original implementation to maintain the same API
  const createItem = async (itemData: any, tags?: string[]) => {
    if (!storage.isReady) {
      return null;
    }
    
    setIsLoading(true);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // Convert the content to key-value format
      // If content is an object, use a meaningful key and stringify the value
      let key = '';
      let value = '';
      
      if (typeof itemData === 'object') {
        // Use the first property as the key, or generate a unique key
        const firstKey = Object.keys(itemData)[0];
        key = itemData.key || itemData.id || firstKey || `${dataType}_${Date.now()}`;
        
        // Add tags to the content for searchability
        const contentWithTags = { ...itemData, tags: tags || [] };
        value = JSON.stringify(contentWithTags);
      } else {
        key = `${dataType}_${Date.now()}`;
        value = String(itemData);
      }
      
      const result = await storage.storeItem(tableType, key, value);
      if (result) {
        const formattedResult = {
          id: String(result.id),
          key: result.item_key,
          value: result.item_value,
          created_at: result.created_at
        };
        
        // After creating the item, refresh data from the central store
        await refreshCentralData(dataType as any);
        return formattedResult;
      }
      return null;
    } catch (err) {
      console.error(`Error creating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error creating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an existing item - keep original implementation to maintain the same API
  const updateItem = async (id: string, itemData: any, tags?: string[]) => {
    if (!storage.isReady) {
      return null;
    }
    
    setIsLoading(true);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // Find the item in our data to get the key
      const item = data.find(item => item.id === id);
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      // Convert the content to key-value format for storage
      let key = item.key;
      let value = '';
      
      if (typeof itemData === 'object') {
        // Add tags to the content for searchability
        const contentWithTags = { ...itemData, tags: tags || [] };
        value = JSON.stringify(contentWithTags);
      } else {
        value = String(itemData);
      }
      
      // For now just treat this as a new store since our temp implementation doesn't support updates
      const result = await storage.storeItem(tableType, key, value);
      if (result) {
        const formattedResult = {
          id: String(result.id),
          key: result.item_key,
          value: result.item_value,
          created_at: result.created_at
        };
        
        // After updating, refresh from the central store
        await refreshCentralData(dataType as any);
        return formattedResult;
      }
      return null;
    } catch (err) {
      console.error(`Error updating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error updating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete an item - keep original implementation but refresh from central store after
  const deleteItem = async (id: string) => {
    if (!storage.isReady) {
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      // Find the item to get the key
      const itemToDelete = data.find(item => item.id === id);
      if (!itemToDelete) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      const success = await storage.deleteItem(tableType, itemToDelete.key);
      if (success) {
        // After deletion, refresh from the central store
        await refreshCentralData(dataType as any);
      }
      return success;
    } catch (err) {
      console.error(`Error deleting ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error deleting item');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh data now delegates to the central store's refreshData
  const refreshData = () => {
    return fetchData();
  };
  
  // Clear all items for this data type
  const clearItems = async () => {
    if (!storage.isReady) {
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Just refresh from the central store
      await refreshCentralData(dataType as any);
      return true;
    } catch (err) {
      console.error(`Error clearing ${dataType} items:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error clearing items');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only trigger a data fetch once when the component mounts
  // No need to re-fetch on every render - the central store handles updates
  const didInitRef = useRef(false);
  
  useEffect(() => {
    // Skip if we've already initialized or storage isn't ready
    if (didInitRef.current || !storage.isReady) return;
    
    // Mark as initialized to prevent refetching
    didInitRef.current = true;
    
    // Only fetch if the central store doesn't already have data for this type
    const existingData = getData(dataType as any);
    if (existingData?.length === 0) {
      refreshCentralData(dataType as any).catch(err => {
        console.error(`[DATA ACCESS] Error refreshing data for ${dataType}:`, err);
      });
    }
  // We deliberately avoid dependencies that could trigger refetches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage.isReady]);
  
  return {
    data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refreshData,
    clearItems,
    storage
  };
};


