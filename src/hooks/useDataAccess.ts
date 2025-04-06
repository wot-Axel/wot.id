'use client';

import { useState, useEffect } from 'react';
import { useCeramic } from '@/context/CeramicContext';
import { useComposeDB } from '@/context/ComposeDBContext';
import { useTableland } from '@/context/TablelandContext';
import { useComposeDBEnabled, useTablelandEnabled } from '@/context/DataProviders';
import { DataType } from '@/utils/ceramicUtils';
import { TableType } from '@/utils/tablelandUtils';
import { monitorAsync, getMetrics, getPerformanceComparison } from '@/utils/performanceMonitor';

/**
 * Hook for accessing data from either Ceramic or ComposeDB
 * This abstracts away the underlying implementation and provides a consistent interface
 */
// Map Ceramic DataType to Tableland TableType
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
  const ceramic = useCeramic();
  const composeDB = useComposeDB();
  const tableland = useTableland();
  const isComposeDBEnabled = useComposeDBEnabled();
  const isTablelandEnabled = useTablelandEnabled();
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data from the appropriate source
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isTablelandEnabled) {
        // Use Tableland with performance monitoring
        return await monitorAsync(
          'fetchData',
          'useDataAccess',
          'tableland',
          async () => {
            if (!tableland.isInitialized) {
              await tableland.connect();
            }
            
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
          }
        );
      } else if (isComposeDBEnabled) {
        // Use ComposeDB
        if (!composeDB.isInitialized) {
          await composeDB.connect();
        }
        
        const models = await composeDB.getModels(dataType);
        setData(models);
      } else {
        // Use original Ceramic implementation
        if (!ceramic.isInitialized) {
          await ceramic.connect();
        }
        
        const models = await ceramic.getModels(dataType);
        setData(models);
      }
    } catch (err) {
      console.error(`Error fetching ${dataType} data:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new item
  const createItem = async (itemData: any, tags?: string[]) => {
    try {
      if (isTablelandEnabled) {
        // Use Tableland with performance monitoring
        return await monitorAsync(
          'createItem',
          'useDataAccess',
          'tableland',
          async () => {
            if (!tableland.isInitialized) {
              await tableland.connect();
            }
            
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
          }
        );
      } else if (isComposeDBEnabled) {
        // Use ComposeDB with performance monitoring
        return await monitorAsync(
          'createItem',
          'useDataAccess',
          'composedb',
          async () => {
            if (!composeDB.isInitialized) {
              await composeDB.connect();
            }
            
            const result = await composeDB.createModel(dataType, itemData, tags);
            if (result) {
              setData(prev => [...prev, result]);
            }
            return result;
          }
        );
      } else {
        // Use original Ceramic implementation with performance monitoring
        return await monitorAsync(
          'createItem',
          'useDataAccess',
          'ceramic',
          async () => {
            if (!ceramic.isInitialized) {
              await ceramic.connect();
            }
            
            const result = await ceramic.createModel(dataType, itemData);
            if (result) {
              setData(prev => [...prev, result]);
            }
            return result;
          }
        );
      }
    } catch (err) {
      console.error(`Error creating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error creating item');
      return null;
    }
  };
  
  // Update an existing item
  const updateItem = async (id: string, itemData: any, tags?: string[]) => {
    try {
      if (isTablelandEnabled) {
        // Use Tableland with performance monitoring
        return await monitorAsync(
          'updateItem',
          'useDataAccess',
          'tableland',
          async () => {
            if (!tableland.isInitialized) {
              await tableland.connect();
            }
            
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
          }
        );
      } else if (isComposeDBEnabled) {
        // Use ComposeDB with performance monitoring
        return await monitorAsync(
          'updateItem',
          'useDataAccess',
          'composedb',
          async () => {
            if (!composeDB.isInitialized) {
              await composeDB.connect();
            }
            
            const result = await composeDB.updateModel(dataType, id, itemData, tags);
            if (result) {
              setData(prev => prev.map(item => item.id === id ? result : item));
            }
            return result;
          }
        );
      } else {
        // Use original Ceramic implementation with performance monitoring
        return await monitorAsync(
          'updateItem',
          'useDataAccess',
          'ceramic',
          async () => {
            if (!ceramic.isInitialized) {
              await ceramic.connect();
            }
            
            const result = await ceramic.updateModel(dataType, id, itemData);
            if (result) {
              setData(prev => prev.map(item => item.id === id ? result : item));
            }
            return result;
          }
        );
      }
    } catch (err) {
      console.error(`Error updating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error updating item');
      return null;
    }
  };
  
  // Delete an item
  const deleteItem = async (id: string) => {
    try {
      if (isTablelandEnabled) {
        // Use Tableland with performance monitoring
        return await monitorAsync(
          'deleteItem',
          'useDataAccess',
          'tableland',
          async () => {
            if (!tableland.isInitialized) {
              await tableland.connect();
            }
            
            const tableType = mapDataTypeToTableType(dataType);
            const success = await tableland.deleteModel(tableType, parseInt(id));
            if (success) {
              setData(prev => prev.filter(item => item.id !== id));
            }
            return success;
          }
        );
      } else if (isComposeDBEnabled) {
        // Use ComposeDB with performance monitoring
        return await monitorAsync(
          'deleteItem',
          'useDataAccess',
          'composedb',
          async () => {
            if (!composeDB.isInitialized) {
              await composeDB.connect();
            }
            
            const success = await composeDB.deleteModel(dataType, id);
            if (success) {
              setData(prev => prev.filter(item => item.id !== id));
            }
            return success;
          }
        );
      } else {
        // Use original Ceramic implementation with performance monitoring
        return await monitorAsync(
          'deleteItem',
          'useDataAccess',
          'ceramic',
          async () => {
            if (!ceramic.isInitialized) {
              await ceramic.connect();
            }
            
            const success = await ceramic.deleteModel(dataType, id);
            if (success) {
              setData(prev => prev.filter(item => item.id !== id));
            }
            return success;
          }
        );
      }
    } catch (err) {
      console.error(`Error deleting ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error deleting item');
      return false;
    }
  };
  
  // Refresh data
  const refreshData = () => {
    return fetchData();
  };
  
  // Clear all items for this data type
  const clearItems = async () => {
    try {
      if (isTablelandEnabled) {
        // Use Tableland with performance monitoring
        return await monitorAsync(
          'clearItems',
          'useDataAccess',
          'tableland',
          async () => {
            if (!tableland.isInitialized) {
              await tableland.connect();
            }
            
            const tableType = mapDataTypeToTableType(dataType);
            const success = await tableland.clearModels(tableType);
            if (success) {
              setData([]);
            }
            return success;
          }
        );
      } else if (isComposeDBEnabled) {
        // Use ComposeDB with performance monitoring
        return await monitorAsync(
          'clearItems',
          'useDataAccess',
          'composedb',
          async () => {
            if (!composeDB.isInitialized) {
              await composeDB.connect();
            }
            
            // For ComposeDB, we'll delete each item individually
            const promises = data.map(item => composeDB.deleteModel(dataType, item.id));
            await Promise.all(promises);
            setData([]);
            return true;
          }
        );
      } else {
        // Use original Ceramic implementation with performance monitoring
        return await monitorAsync(
          'clearItems',
          'useDataAccess',
          'ceramic',
          async () => {
            if (!ceramic.isInitialized) {
              await ceramic.connect();
            }
            
            // For Ceramic, we need to delete items individually since clearCollection isn't directly exposed
            // in the context interface
            const promises = data.map(item => ceramic.deleteModel(dataType, item.id));
            await Promise.all(promises);
            setData([]);
            return true;
          }
        );
      }
    } catch (err) {
      console.error(`Error clearing ${dataType} items:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error clearing items');
      return false;
    }
  };
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if ((isTablelandEnabled && tableland.isInitialized) ||
        (isComposeDBEnabled && composeDB.isInitialized) || 
        (!isComposeDBEnabled && !isTablelandEnabled && ceramic.isInitialized)) {
      fetchData();
    }
  }, [dataType, isTablelandEnabled, isComposeDBEnabled, 
      tableland.isInitialized, ceramic.isInitialized, composeDB.isInitialized]);
  
  return {
    data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refreshData,
    clearItems,
    // Expose the underlying implementations for advanced use cases
    ceramic,
    composeDB,
    tableland,
    usingComposeDB: isComposeDBEnabled,
    usingTableland: isTablelandEnabled,
    // Performance monitoring functions
    getPerformanceMetrics: () => getMetrics(isTablelandEnabled ? 'tableland' : isComposeDBEnabled ? 'composedb' : 'ceramic'),
    getPerformanceComparison: () => getPerformanceComparison('fetchData')
  };
};
