// Define compatible types locally rather than importing from tablelandUtils
import { TableType } from './storageUtils';

interface TableData {
  id?: number;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

// Prefix for localStorage keys to avoid collisions
const STORAGE_PREFIX = 'wot_id_local_';

// Interface for table metadata
interface TableMetadata {
  name: string;
  address: string;
  created: string;
}

/**
 * Generate a consistent table name for localStorage
 * @param tableType Type of table
 * @param address User's wallet address
 * @returns Formatted table name
 */
export const generateLocalTableName = (tableType: TableType, address: string): string => {
  const cleanAddress = address.startsWith('0x') ? address.slice(2).toLowerCase() : address.toLowerCase();
  const prefix = cleanAddress.slice(0, 8);
  return `${tableType}_${prefix}`;
};

/**
 * Create a local table in localStorage
 * @param tableType Type of table
 * @param address User's wallet address
 * @returns Table name
 */
export const createLocalTable = (tableType: TableType, address: string): string => {
  const tableName = generateLocalTableName(tableType, address);
  const storedTables = getStoredTables();
  
  // Create entry if it doesn't exist already
  if (!storedTables.some(t => t.name === tableName)) {
    storedTables.push({
      name: tableName,
      address,
      created: new Date().toISOString()
    });
    
    // Save tables metadata
    localStorage.setItem(`${STORAGE_PREFIX}tables`, JSON.stringify(storedTables));
    
    // Initialize empty data array for the table
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify([]));
  }
  
  console.log(`[LOCAL STORAGE] Created table ${tableName} for address ${address}`);
  return tableName;
};

/**
 * Get list of stored tables
 * @returns Array of table metadata
 */
const getStoredTables = (): TableMetadata[] => {
  try {
    const storedTables = localStorage.getItem(`${STORAGE_PREFIX}tables`);
    return storedTables ? JSON.parse(storedTables) : [];
  } catch (error) {
    console.error('[LOCAL STORAGE] Error getting stored tables:', error);
    return [];
  }
};

/**
 * Check if a local table exists
 * @param tableType Type of table
 * @param address User's wallet address
 * @returns Object with exists flag and table name
 */
export const checkLocalTableExists = (tableType: TableType, address: string): {exists: boolean, tableName: string} => {
  const tableName = generateLocalTableName(tableType, address);
  const storedTables = getStoredTables();
  const exists = storedTables.some(t => t.name === tableName);
  
  return {
    exists,
    tableName
  };
};

/**
 * Insert data into a local table
 * @param tableName Name of the table
 * @param key Key for the data
 * @param value Value to store
 */
export const insertLocalData = (tableName: string, key: string, value: string): void => {
  try {
    // Get existing data
    const dataStr = localStorage.getItem(`${STORAGE_PREFIX}${tableName}`);
    const data: TableData[] = dataStr ? JSON.parse(dataStr) : [];
    
    // Find highest id to ensure we increment correctly
    const maxId = data.length > 0 ? Math.max(...data.map(item => typeof item.id === 'number' ? item.id : 0)) : 0;
    
    // Add new item
    data.push({
      id: maxId + 1,
      key,
      value,
      created_at: new Date().toISOString()
    });
    
    // Save back to localStorage
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(data));
    console.log(`[LOCAL STORAGE] Inserted data into ${tableName}`, { key });
  } catch (error) {
    console.error(`[LOCAL STORAGE] Error inserting data into ${tableName}:`, error);
    throw error;
  }
};

/**
 * Get data from a local table
 * @param tableName Name of the table
 * @returns Array of table data
 */
export const getLocalData = (tableName: string): TableData[] => {
  try {
    const dataStr = localStorage.getItem(`${STORAGE_PREFIX}${tableName}`);
    const data: TableData[] = dataStr ? JSON.parse(dataStr) : [];
    console.log(`[LOCAL STORAGE] Retrieved ${data.length} items from ${tableName}`);
    return data;
  } catch (error) {
    console.error(`[LOCAL STORAGE] Error getting data from ${tableName}:`, error);
    return [];
  }
};

/**
 * Clear data from a local table
 * @param tableName Name of the table
 */
export const clearLocalData = (tableName: string): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify([]));
    console.log(`[LOCAL STORAGE] Cleared data from ${tableName}`);
  } catch (error) {
    console.error(`[LOCAL STORAGE] Error clearing data from ${tableName}:`, error);
    throw error;
  }
};
