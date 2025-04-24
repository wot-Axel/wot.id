 'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHelia } from '@/context/HeliaContext';
// (Removed: TableType, TableData, PrivateData from storageUtils)
// (TODO: Replace all local storage logic with EAS logic.)
import { DataType } from '@/types/storage';

/**
 * Hook for accessing data from 
 * This provides a consistent interface for all data types
 */

// Import the useData hook from DataContext
import { useData } from '@/context/DataContext';

export const useDataAccess = (dataType: DataType) => {
  // Get direct access to the centralized data store
  const { getData, isLoading: getIsLoading, error: getError, refreshData: refreshCentralData } = useData();
  // MIGRATION: use Helia context instead of 
  const { isReady, addFile, getFile } = useHelia();
  // Each dataType/table has an index mapping: key → CID
  // The index itself is stored in Helia as a JSON object, and its CID is tracked in localStorage (or a profile)
  const INDEX_CID_KEY = `helia_index_cid_${dataType}`;

  // Helper to load the current index mapping (key→CID)
  // Refactored: No localStorage usage. Use in-memory or decentralized storage only.
  // Use a cache object for CIDs (per dataType)
  const indexCache = useRef<{ [key in DataType]?: Record<string, string> }>({});
  const loadIndex = async (): Promise<Record<string, string>> => {
    if (indexCache.current[dataType]) {
      return indexCache.current[dataType]!;
    }
    // Optionally, fetch from decentralized storage (Helia/IPFS) if needed
    return {};
  };

  // Helper to save the index mapping and return new CID
  const saveIndex = async (index: Record<string, string>): Promise<string | null> => {
    const json = JSON.stringify(index);
    const cid = await addFile(json);
    if (cid) indexCache.current[dataType] = index;
    return cid;
  };

  
  // Local state to maintain the existing API
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // List all items for this dataType from Helia
  const listItems = useCallback(async () => {
    if (!isReady) return [];
    const index = await loadIndex();
    const result: any[] = [];
    for (const [key, cid] of Object.entries(index)) {
      const bytes = await getFile(cid);
      if (!bytes) continue;
      let value = '';
      try {
        value = new TextDecoder().decode(bytes);
      } catch {
        value = '';
      }
      result.push({ id: key, key, value, cid });
    }
    return result;
  }, [isReady, dataType]);

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
    if (!isReady) {
      console.warn(`[DATA ACCESS]  not ready for ${dataType}`);
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
  // Create a new item: store value in Helia, update index, save index
  const createItem = async (itemData: any, tags?: string[]) => {
    if (!isReady) {
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Prepare key and value
      let key = '';
      let value = '';
      if (typeof itemData === 'object') {
        const firstKey = Object.keys(itemData)[0];
        key = itemData.key || itemData.id || firstKey || `${dataType}_${Date.now()}`;
        value = JSON.stringify({ ...itemData, tags: tags || [] });
      } else {
        key = `${dataType}_${Date.now()}`;
        value = String(itemData);
      }
      // 2. Store value in Helia
      const valueCid = await addFile(value);
      if (!valueCid) throw new Error('Failed to store value in Helia');
      // 3. Load and update index
      const index = await loadIndex();
      index[key] = valueCid;
      // 4. Save new index to Helia
      const indexCid = await saveIndex(index);
      // 5. Refresh data
      await refreshCentralData(dataType as any);
      return {
        id: key,
        key,
        value,
        cid: valueCid,
        indexCid
      };
    } catch (err) {
      console.error(`Error creating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error creating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an existing item - keep original implementation to maintain the same API
  // Update: same as create, but key is fixed
  const updateItem = async (id: string, itemData: any, tags?: string[]) => {
    if (!isReady) {
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Find the item
      const item = data.find(item => item.id === id);
      if (!item) throw new Error(`Item with ID ${id} not found`);
      const key = item.key;
      let value = '';
      if (typeof itemData === 'object') {
        value = JSON.stringify({ ...itemData, tags: tags || [] });
      } else {
        value = String(itemData);
      }
      // 2. Store new value in Helia
      const valueCid = await addFile(value);
      if (!valueCid) throw new Error('Failed to store value in Helia');
      // 3. Load and update index
      const index = await loadIndex();
      index[key] = valueCid;
      // 4. Save new index to Helia
      const indexCid = await saveIndex(index);
      // 5. Refresh data
      await refreshCentralData(dataType as any);
      return {
        id: key,
        key,
        value,
        cid: valueCid,
        indexCid
      };
    } catch (err) {
      console.error(`Error updating ${dataType} item:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error updating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete an item - keep original implementation but refresh from central store after
  // Delete: remove key from index and save
  const deleteItem = async (id: string) => {
    if (!isReady) {
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Find the item
      const item = data.find(item => item.id === id);
      if (!item) throw new Error(`Item with ID ${id} not found`);
      const key = item.key;
      // 2. Load and update index
      const index = await loadIndex();
      if (index[key]) delete index[key];
      // 3. Save new index
      await saveIndex(index);
      // 4. Refresh data
      await refreshCentralData(dataType as any);
      return true;
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
    if (!isReady) {
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
    // Skip if we've already initialized or  isn't ready
    if (didInitRef.current || !isReady) return;
    
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
  }, [isReady]);
  
  return {
    data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refreshData,
    clearItems
  };
};
