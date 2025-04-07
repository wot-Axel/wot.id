'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
// Performance monitoring removed
import { 
  TableType, 
  TableData,
  initTableland,
  checkTableExists,
  createTable,
  insertData,
  getData,
  clearData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';

// Enhanced logging utility for debugging
const DEBUG_MODE = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[TABLELAND DEBUG ${timestamp}]`;
    if (data) {
      console.log(logPrefix, message, data);
    } else {
      console.log(logPrefix, message);
    }
    
    // Add to debug log in localStorage for retrieval
    try {
      const existingLogs = localStorage.getItem('tableland_debug_logs') || '[]';
      const logs = JSON.parse(existingLogs);
      logs.push({ timestamp, message, data: data ? JSON.stringify(data) : undefined });
      // Keep only the last 100 logs to prevent localStorage from getting too large
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('tableland_debug_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save debug log to localStorage:', e);
    }
  }
};

// Define types for our Tableland models
export interface TablelandModel {
  id: number;
  key: string;
  value: string;
  created_at: string;
}

// Enhanced context implementation with Tableland functionality
interface TablelandContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  client: Database | null;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  createModel: (modelType: TableType, key: string, value: string) => Promise<TablelandModel | null>;
  getModels: (modelType: TableType) => Promise<TablelandModel[]>;
  updateModel: (modelType: TableType, id: number, key: string, value: string) => Promise<TablelandModel | null>;
  deleteModel: (modelType: TableType, id: number) => Promise<boolean>;
  clearModels: (modelType: TableType) => Promise<boolean>;
  getTableName: (modelType: TableType) => Promise<string | null>;
}

const TablelandContext = createContext<TablelandContextType>({
  isInitialized: false,
  isLoading: false,
  error: null,
  client: null,
  address: null,
  connect: async () => {},
  disconnect: () => {},
  createModel: async () => null,
  getModels: async () => [],
  updateModel: async () => null,
  deleteModel: async () => false,
  clearModels: async () => false,
  getTableName: async () => null
});

export const useTableland = () => useContext(TablelandContext);

export const TablelandProvider = ({ children }: { children: ReactNode }) => {
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const address = walletAddress || null; // Convert undefined to null to match our type definition
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Database | null>(null);
  const [tableNames, setTableNames] = useState<Record<TableType, string | null>>({
    [TableType.PRIVATE]: null,
    [TableType.MEDICAL]: null,
    [TableType.ACCOUNTS]: null,
    [TableType.CONTACTS]: null,
    [TableType.AFFILIATIONS]: null,
    [TableType.CURRENCIES]: null,
    [TableType.DIGITAL_ASSETS]: null,
    [TableType.CHAT]: null
  });
  
  // Initialize Tableland when the user connects their wallet
  useEffect(() => {
    if (isConnected && address && !isInitialized && !isLoading) {
      connect();
    }
  }, [isConnected, address, isInitialized, isLoading]);
  
  // Connect to Tableland
  const connect = async () => {
    // Skip initialization on server-side
    if (typeof window === 'undefined') {
      debugLog('Server-side rendering detected, skipping Tableland initialization');
      return;
    }
    
    if (isLoading || isInitialized || !address) {
      debugLog(`Skipping connection - isLoading: ${isLoading}, isInitialized: ${isInitialized}, address: ${address ? 'present' : 'missing'}`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Connecting to Tableland with address: ${address}`);
      
      // Initialize Tableland client
      debugLog('Calling initTableland()');
      const tablelandClient = await initTableland();
      
      if (!tablelandClient) {
        debugLog('Tableland client initialization returned null or undefined');
        throw new Error('Failed to initialize Tableland client');
      }
      
      debugLog('Tableland client initialized successfully', tablelandClient);
      setClient(tablelandClient);
      setIsInitialized(true);
      debugLog('Connected to Tableland');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error connecting to Tableland';
      debugLog(`Error connecting to Tableland: ${errorMessage}`, err);
      console.error('Error connecting to Tableland:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from Tableland
  const disconnect = () => {
    setClient(null);
    setIsInitialized(false);
    setTableNames({
      [TableType.PRIVATE]: null,
      [TableType.MEDICAL]: null,
      [TableType.ACCOUNTS]: null,
      [TableType.CONTACTS]: null,
      [TableType.AFFILIATIONS]: null,
      [TableType.CURRENCIES]: null,
      [TableType.DIGITAL_ASSETS]: null,
      [TableType.CHAT]: null
    });
    console.log('Disconnected from Tableland');
  };
  
  // Get table name for a specific type, checking if it exists and caching the result
  const getTableName = async (modelType: TableType): Promise<string | null> => {
    // Skip if we're on the server side
    if (typeof window === 'undefined') {
      debugLog(`Server-side rendering detected, skipping getTableName for ${modelType}`);
      // Return a placeholder for server-side rendering
      return `${modelType.toString().toLowerCase()}_placeholder`;
    }
    
    if (!isInitialized || !client || !address) {
      debugLog(`Tableland not initialized for getTableName - isInitialized: ${isInitialized}, client: ${client ? 'present' : 'missing'}, address: ${address ? 'present' : 'missing'}`);
      console.error('Tableland not initialized');
      return `${modelType.toString().toLowerCase()}_uninit`;
    }
    
    // If we already have the table name cached, return it
    if (tableNames[modelType]) {
      return tableNames[modelType];
    }
    
    // Ensure we have a valid fallback name that follows Tableland naming conventions
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    const addressPrefix = cleanAddress.toLowerCase().slice(0, 8);
    const safeModelType = modelType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
    // Always use lowercase for the entire table name to ensure consistency
    const fallbackName = `${safeModelType}_${addressPrefix}`.toLowerCase();
    
    try {
      // Check if table exists
      let result = null;
      try {
        debugLog(`Checking if table exists for ${modelType} with address ${address}`);
        result = await checkTableExists(client, modelType, address);
        debugLog(`Table exists check result for ${modelType}:`, result);
      } catch (checkError) {
        debugLog(`Error checking if table exists for ${modelType}:`, checkError);
        console.error(`Error checking if table exists for ${modelType}:`, checkError);
        return fallbackName;
      }
      
      // Handle case where result might be null or undefined
      if (!result) {
        console.warn(`Null result from checkTableExists for ${modelType}`);
        return fallbackName;
      }
      
      // Safely destructure with defaults
      const exists = result.exists === true; // Ensure it's a boolean
      const tableName = result.tableName || fallbackName;
      
      if (exists && tableName) {
        // Cache the table name
        setTableNames(prev => ({
          ...prev,
          [modelType]: tableName
        }));
        return tableName;
      }
      
      // If table doesn't exist, create it
      try {
        debugLog(`Creating table for ${modelType} with address ${address}`);
        const newTableName = await createTable(client, modelType, address);
        debugLog(`Table creation result for ${modelType}:`, newTableName);
        
        // Handle case where newTableName might be null or undefined
        if (!newTableName) {
          debugLog(`Null result from createTable for ${modelType}`);
          console.warn(`Null result from createTable for ${modelType}`);
          return fallbackName;
        }
        
        // Cache the new table name
        setTableNames(prev => ({
          ...prev,
          [modelType]: newTableName
        }));
        
        return newTableName;
      } catch (createError) {
        console.error(`Error creating table for ${modelType}:`, createError);
        return fallbackName;
      }
    } catch (error) {
      console.error(`Error getting table name for ${modelType}:`, error);
      setError(error instanceof Error ? error.message : `Unknown error getting table name for ${modelType}`);
      return fallbackName;
    }
  };
  
  // Create a new model in Tableland
  const createModel = async (
    modelType: TableType, 
    key: string,
    value: string
  ): Promise<TablelandModel | null> => {
    try {
      if (!isInitialized || !client || !address) {
        console.error('Tableland not initialized');
        return null;
      }
      
      try {
        // Get table name, creating it if necessary
        const tableName = await getTableName(modelType);
        
        if (!tableName) {
          throw new Error(`Failed to get table name for ${modelType}`);
        }
        
        // Insert data
        await insertData(client, modelType, tableName, key, value);
        
        // Get the newly created record (we'll just get all records and take the last one)
        const records = await getData(client, modelType, tableName);
        const newRecord = records[records.length - 1];
        
        if (!newRecord) {
          throw new Error('Failed to retrieve newly created record');
        }
        
        // Return in the expected format
        return {
          id: newRecord.id,
          key: newRecord.key,
          value: newRecord.value,
          created_at: newRecord.created_at
        };
      } catch (error) {
        console.error('Error creating model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error creating model');
        return null;
      }
    } catch (error) {
      console.error('Error in createModel:', error);
      return null;
    }
  };
  
  // Get all models of a specific type
  const getModels = async (modelType: TableType): Promise<TablelandModel[]> => {
    try {
      if (!isInitialized || !client || !address) {
        console.error('Tableland not initialized');
        return [];
      }
      
      try {
        // Get table name
        const tableName = await getTableName(modelType);
        
        if (!tableName) {
          // Table doesn't exist yet, return empty array
          return [];
        }
        
        // Get all records
        const records = await getData(client, modelType, tableName);
        
        // Return in the expected format
        return records.map(record => ({
          id: record.id,
          key: record.key,
          value: record.value,
          created_at: record.created_at
        }));
      } catch (error) {
        console.error('Error getting models:', error);
        setError(error instanceof Error ? error.message : 'Unknown error getting models');
        return [];
      }
    } catch (error) {
      console.error('Error in getModels:', error);
      return [];
    }
  };
  
  // Update a model
  const updateModel = async (
    modelType: TableType, 
    id: number, 
    key: string,
    value: string
  ): Promise<TablelandModel | null> => {
    try {
      if (!isInitialized || !client || !address) {
        console.error('Tableland not initialized');
        return null;
      }
      
      try {
        // Get table name
        const tableName = await getTableName(modelType);
        
        if (!tableName) {
          throw new Error(`Table for ${modelType} does not exist`);
        }
        
        // In Tableland, we need to delete and re-insert to update
        // First, delete the record
        // Ensure table name is lowercase for consistency
        const safeTableName = tableName.toLowerCase();
        await client.prepare(`
          DELETE FROM ${safeTableName} WHERE id = ${id}
        `).run();
        
        // Then insert the new record with the same ID
        const timestamp = new Date().toISOString();
        await client.prepare(`
          INSERT INTO ${safeTableName} (id, item_key, item_value, created_at)
          VALUES (${id}, '${key}', '${value}', '${timestamp}')
        `).run();
        
        // Return the updated record
        return {
          id,
          key,
          value,
          created_at: timestamp
        };
      } catch (error) {
        console.error('Error updating model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error updating model');
        return null;
      }
    } catch (error) {
      console.error('Error in updateModel:', error);
      return null;
    }
  };
  
  // Delete a model
  const deleteModel = async (modelType: TableType, id: number): Promise<boolean> => {
    try {
      if (!isInitialized || !client || !address) {
        console.error('Tableland not initialized');
        return false;
      }
      
      try {
        // Get table name
        const tableName = await getTableName(modelType);
        
        if (!tableName) {
          throw new Error(`Table for ${modelType} does not exist`);
        }
        
        // Delete the record
        await client.prepare(`
          DELETE FROM ${tableName} WHERE id = ${id}
        `).run();
        
        return true;
      } catch (error) {
        console.error('Error deleting model:', error);
        setError(error instanceof Error ? error.message : 'Unknown error deleting model');
        return false;
      }
    } catch (error) {
      console.error('Error in deleteModel:', error);
      return false;
    }
  };
  
  // Clear all models of a specific type
  const clearModels = async (modelType: TableType): Promise<boolean> => {
    try {
      if (!isInitialized || !client || !address) {
        console.error('Tableland not initialized');
        return false;
      }
      
      try {
        // Get table name
        const tableName = await getTableName(modelType);
        
        if (!tableName) {
          // Table doesn't exist, nothing to clear
          return true;
        }
        
        // Clear the table
        await clearData(client, modelType, tableName);
        
        return true;
      } catch (error) {
        console.error('Error clearing models:', error);
        setError(error instanceof Error ? error.message : 'Unknown error clearing models');
        return false;
      }
    } catch (error) {
      console.error('Error in clearModels:', error);
      return false;
    }
  };
  
  // Add a global function to retrieve debug logs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getTablelandDebugLogs = () => {
        try {
          const logs = localStorage.getItem('tableland_debug_logs') || '[]';
          return JSON.parse(logs);
        } catch (e) {
          console.error('Failed to retrieve debug logs:', e);
          return [];
        }
      };
      
      // Add a function to check Tableland client state
      (window as any).checkTablelandState = () => {
        return {
          isInitialized,
          isLoading,
          error,
          clientExists: !!client,
          address,
          tableNames
        };
      };
    }
  }, [isInitialized, isLoading, error, client, address, tableNames]);

  return (
    <TablelandContext.Provider
      value={{
        isInitialized,
        isLoading,
        error,
        client,
        address,
        connect,
        disconnect,
        createModel,
        getModels,
        updateModel,
        deleteModel,
        clearModels,
        getTableName
      }}
    >
      {children}
    </TablelandContext.Provider>
  );
};
