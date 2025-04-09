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
      return TableType.CHAT;
    case DataType.PRIVATE:
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};

export const useDataAccess = (dataType: DataType) => {
  const storage = useStorage();
  
  // Use refs for state that shouldn't trigger re-renders
  const dataRef = useRef<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  
  // Fetch data from storage with throttling
  const fetchData = async () => {
    if (!storage.isReady) {
      console.warn(`[DATA ACCESS] Storage not ready for ${dataType}`);
      return [];
    }
    
    // Simple throttling to prevent rapid successive calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (timeSinceLastFetch < 2000) {
      console.log(`[DATA ACCESS] Throttling fetch for ${dataType}, last fetch ${Math.round(timeSinceLastFetch/1000)}s ago`);
      return dataRef.current;
    }
    
    lastFetchRef.current = now;
    setIsLoading(true);
    setError(null);
    
    try {
      // Use storage service
      const tableType = mapDataTypeToTableType(dataType);
      const models = await storage.listItems(tableType);
      
      // Format data to match the expected structure
      const formattedModels = models.map(model => ({
        id: String(model.id),
        key: model.item_key,
        value: model.item_value,
        created_at: model.created_at
      }));
      
      // Store in both state and ref to maintain stability
      dataRef.current = formattedModels;
      setData(formattedModels);
      return formattedModels;
    } catch (err) {
      console.error(`Error fetching ${dataType} data:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new item
  const createItem = async (itemData: any, tags?: string[]) => {
    if (!storage.isReady) {
      return null;
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
      
      // For Tableland, we need to convert the content to key-value format
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
      // Our simple implementation doesn't support bulk delete
      // Just clear the local state for now
      const success = true;
      if (success) {
        setData([]);
      }
      return success;
    } catch (err) {
      console.error(`Error clearing ${dataType} items:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error clearing items');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // One-time data fetch only on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!storage.isReady) return;
      
      try {
        await fetchData();
      } catch (err) {
        console.error(`[DATA ACCESS] Error loading initial data for ${dataType}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load initial data');
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // This effect watches storage readiness but doesn't trigger extra fetches
  useEffect(() => {
    if (storage.isReady && dataRef.current.length === 0) {
      fetchData();
    }
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


