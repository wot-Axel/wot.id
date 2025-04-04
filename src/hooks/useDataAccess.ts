'use client';

import { useState, useEffect } from 'react';
import { useCeramic } from '@/context/CeramicContext';
import { useComposeDB } from '@/context/ComposeDBContext';
import { useComposeDBEnabled } from '@/context/DataProviders';
import { DataType } from '@/utils/ceramicUtils';
import { monitorAsync } from '@/utils/performanceMonitor';

/**
 * Hook for accessing data from either Ceramic or ComposeDB
 * This abstracts away the underlying implementation and provides a consistent interface
 */
export const useDataAccess = (dataType: DataType) => {
  const ceramic = useCeramic();
  const composeDB = useComposeDB();
  const isComposeDBEnabled = useComposeDBEnabled();
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data from the appropriate source
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isComposeDBEnabled) {
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
      if (isComposeDBEnabled) {
        // Use ComposeDB
        if (!composeDB.isInitialized) {
          await composeDB.connect();
        }
        
        const result = await composeDB.createModel(dataType, itemData, tags);
        if (result) {
          setData(prev => [...prev, result]);
        }
        return result;
      } else {
        // Use original Ceramic implementation
        if (!ceramic.isInitialized) {
          await ceramic.connect();
        }
        
        const result = await ceramic.createModel(dataType, itemData);
        if (result) {
          setData(prev => [...prev, result]);
        }
        return result;
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
      if (isComposeDBEnabled) {
        // Use ComposeDB
        if (!composeDB.isInitialized) {
          await composeDB.connect();
        }
        
        const result = await composeDB.updateModel(dataType, id, itemData, tags);
        if (result) {
          setData(prev => prev.map(item => item.id === id ? result : item));
        }
        return result;
      } else {
        // Use original Ceramic implementation
        if (!ceramic.isInitialized) {
          await ceramic.connect();
        }
        
        const result = await ceramic.updateModel(dataType, id, itemData);
        if (result) {
          setData(prev => prev.map(item => item.id === id ? result : item));
        }
        return result;
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
      if (isComposeDBEnabled) {
        // Use ComposeDB
        if (!composeDB.isInitialized) {
          await composeDB.connect();
        }
        
        const success = await composeDB.deleteModel(dataType, id);
        if (success) {
          setData(prev => prev.filter(item => item.id !== id));
        }
        return success;
      } else {
        // Use original Ceramic implementation
        if (!ceramic.isInitialized) {
          await ceramic.connect();
        }
        
        const success = await ceramic.deleteModel(dataType, id);
        if (success) {
          setData(prev => prev.filter(item => item.id !== id));
        }
        return success;
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
      if (isComposeDBEnabled) {
        // Use ComposeDB
        if (!composeDB.isInitialized) {
          await composeDB.connect();
        }
        
        // For ComposeDB, we'll delete each item individually
        const promises = data.map(item => composeDB.deleteModel(dataType, item.id));
        await Promise.all(promises);
        setData([]);
        return true;
      } else {
        // Use original Ceramic implementation
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
    } catch (err) {
      console.error(`Error clearing ${dataType} items:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error clearing items');
      return false;
    }
  };
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if ((isComposeDBEnabled && composeDB.isInitialized) || 
        (!isComposeDBEnabled && ceramic.isInitialized)) {
      fetchData();
    }
  }, [dataType, isComposeDBEnabled, ceramic.isInitialized, composeDB.isInitialized]);
  
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
    usingComposeDB: isComposeDBEnabled
  };
};
