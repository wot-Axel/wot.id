'use client';

import { useState, useEffect } from 'react';
import { useTableland } from '@/context/TablelandContext';
import { TableType, TableData, PrivateData } from '@/utils/tablelandUtils';

/**
 * Hook for accessing data from Tableland
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
  const tableland = useTableland();
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data from Tableland
  const fetchData = async () => {
    if (!tableland.isInitialized) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use Tableland
      const tableType = mapDataTypeToTableType(dataType);
      const models = await tableland.getModels(tableType);
      
      // Format data to match the expected structure
      const formattedModels = models.map(model => ({
        id: String(model.id),
        key: model.key,
        value: model.value,
        created_at: model.created_at
      }));
      
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
    if (!tableland.isInitialized) {
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      
      // For Tableland, we need to convert the content to key-value format
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
      
      const result = await tableland.createModel(tableType, key, value);
      if (result) {
        const formattedResult = {
          id: String(result.id),
          key: result.key,
          value: result.value,
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
    if (!tableland.isInitialized) {
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
      
      const result = await tableland.updateModel(tableType, parseInt(id), key, value);
      if (result) {
        const formattedResult = {
          id: String(result.id),
          key: result.key,
          value: result.value,
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
    if (!tableland.isInitialized) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      const success = await tableland.deleteModel(tableType, parseInt(id));
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
    if (!tableland.isInitialized) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableType = mapDataTypeToTableType(dataType);
      const success = await tableland.clearModels(tableType);
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
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (tableland.isInitialized) {
      fetchData();
    }
  }, [dataType, tableland.isInitialized]);
  
  return {
    data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refreshData,
    clearItems,
    tableland
  };
};
