'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '@/context/StorageContext';
import { TableType, TableData } from '@/utils/storageUtils';
import { clearDecryptionCache } from '@/utils/gunUtils';

// Define PrivateData interface to maintain compatibility
interface PrivateData {
  id?: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

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
      return TableType.CHAT;
    case DataType.PRIVATE:
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};

export const useDataAccess = (dataType: DataType) => {
  const storage = useStorage();
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add a state to track if initial data has been fetched
  const [dataInitialized, setDataInitialized] = useState(false);
  
  // Fetch data from storage with timeout safety - memoized to prevent rerenders
  const fetchData = useCallback(async () => {
    // Skip if already loading to prevent parallel fetches
    if (isLoading) {
      console.log(`[DATA ACCESS] Skipping fetch for ${dataType} - already in progress`);
      return data;
    }
    if (!storage.isReady) {
      console.warn(`[DATA ACCESS] Storage not ready for ${dataType}`);
      setError('Storage not ready');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    // Add timeout to prevent getting stuck
    const timeout = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Data fetch operation timed out')), 5000);
    });
    
    try {
      // Use storage service with timeout safety
      const tableType = mapDataTypeToTableType(dataType);
      console.log(`[DATA ACCESS] Fetching data for ${dataType} (tableType: ${tableType})`);
      
      const fetchPromise = storage.listItems(tableType);
      const models = await Promise.race([fetchPromise, timeout]);
      
      if (!models) {
        console.warn(`[DATA ACCESS] No data returned for ${dataType}`);
        setData([]);
        return [];
      }
      
      // Handle non-array results (could happen with Gun.js)
      if (!Array.isArray(models)) {
        console.warn(`[DATA ACCESS] Non-array data returned for ${dataType}:`, models);
        setData([]);
        return [];
      }
      
      console.log(`[DATA ACCESS] Retrieved ${models.length} items for ${dataType}`);
      
      // Debug the first item if available
      if (models.length > 0) {
        console.log(`[DATA ACCESS] Sample item for ${dataType}:`, { 
          ...models[0],
          item_value: models[0].item_value ? models[0].item_value.substring(0, 20) + '...' : null 
        });
      }
      
      // Format data to match the expected structure
      // Filter out any null or undefined items
      const formattedModels = models
        .filter(model => {
          const isValid = model && model.item_key && model.item_value;
          if (!isValid) {
            console.warn(`[DATA ACCESS] Filtering out invalid model:`, model);
          }
          return isValid;
        })
        .map(model => ({
          id: String(model.id || ''),
          key: model.item_key,
          value: model.item_value,
          created_at: model.created_at || new Date().toISOString()
        }));
      
      console.log(`[DATA ACCESS] Formatted ${formattedModels.length} items for ${dataType}`);
      setData(formattedModels);
      return formattedModels;
    } catch (err) {
      console.error(`Error fetching ${dataType} data:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching data');
      setData([]); // Set empty data on error to ensure UI can progress
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [storage, dataType]);
  
  // Create a new item
  const createItem = async (itemData: any, tags?: string[]) => {
    if (!storage.isReady) {
      throw new Error('Storage system not ready');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // Convert the content to key-value format
      // If content is an object, use a meaningful key and stringify the value
      let key = '';
      let value = '';
      
      if (typeof itemData === 'object') {
        // Generate a more reliable unique key using timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        key = itemData.key || itemData.id || `${dataType}_${timestamp}_${randomSuffix}`;
        
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
        setData(prev => [...prev, formattedResult]);
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
  
  // Update an existing item
  const updateItem = async (id: string, itemData: any, tags?: string[]) => {
    if (!storage.isReady) {
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // Find the item in our local data to get the key
      const item = data.find(item => item.id === id);
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      // Convert the content to key-value format for Gun.js storage
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
        setData(prev => prev.map(item => item.id === id ? formattedResult : item));
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
  
  // Delete an item
  const deleteItem = async (id: string) => {
    if (!storage.isReady) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      // Find the item to get the key
      const itemToDelete = data.find(item => item.id === id);
      if (!itemToDelete) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      const success = await storage.deleteItem(tableType, itemToDelete.key);
      if (success) {
        setData(prev => prev.filter(item => item.id !== id));
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
  
  // Refresh data
  const refreshData = () => {
    return fetchData();
  };
  
  // Clear all items for this data type
  const clearItems = async () => {
    if (!storage.isReady) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // Get all current items
      const currentItems = [...data];
      let success = true;
      
      // Delete each item from Gun.js storage
      for (const item of currentItems) {
        const itemSuccess = await storage.deleteItem(tableType, item.key);
        if (!itemSuccess) {
          success = false;
          console.warn(`Failed to delete item with key: ${item.key}`);
        }
      }
      
      // Clear the decryption cache for this table type to prevent stale data
      clearDecryptionCache(tableType);
      
      // Clear the local state regardless of individual deletion success
      // This ensures UI is clean even if some deletions failed
      setData([]);
      return success;
    } catch (err) {
      console.error(`Error clearing ${dataType} items:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error clearing items');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    // Only fetch data once when storage is ready and not already fetched
    if (storage.isReady && !dataInitialized && !isLoading) {
      console.log(`[DATA ACCESS] Initial data fetch for ${dataType}`);
      fetchData().then(() => {
        setDataInitialized(true);
      });
    }
  // Importantly, DO NOT include dataType in the dependency array 
  // This prevents refetching when multiple components use the same data type
  }, [storage.isReady, dataInitialized, isLoading]);
  
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
