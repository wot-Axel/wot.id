// src/utils/storageUtils.ts
// Direct localStorage implementation with no external dependencies

// Define table types for consistent usage
export enum TableType {
  PRIVATE = 'private',
  CONTACTS = 'contacts',
  DIGITAL_ASSETS = 'digital_assets',
  MEDICAL = 'medical',
  AFFILIATIONS = 'affiliations',
  CHAT = 'chat',
  SYSTEM = 'system' // Used for system operations and verification
}

// Consistent data structure for storage items
export interface TableData {
  id: string;
  item_key: string;
  item_value: string;
  created_at: string;
}

// Interface for private data (maintains type compatibility)
export interface PrivateData extends TableData {
  // Any specific fields from the original interface
}

// Helper function to generate table name based on type and address
export const generateTableName = (tableType: TableType, address: string): string => {
  if (!address) return '';
  
  const cleanAddress = address.startsWith('0x') ? address.slice(2).toLowerCase() : address.toLowerCase();
  const prefix = cleanAddress.slice(0, 8);
  return `wot_id_${tableType}_${prefix}`;
};

// Store an item in localStorage
export const storeItem = async (tableType: TableType, key: string, value: string): Promise<TableData> => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available');
    }

    const address = localStorage.getItem('userAddress');
    if (!address) {
      throw new Error('No wallet address available');
    }

    const tableName = generateTableName(tableType, address);
    let tableData: TableData[] = [];
    
    // Get existing table data if available
    const existingData = localStorage.getItem(tableName);
    if (existingData) {
      try {
        tableData = JSON.parse(existingData);
      } catch (e) {
        console.error(`[STORAGE] Error parsing data for ${tableName}:`, e);
        tableData = [];
      }
    }
    
    // Create new item
    const timestamp = new Date().toISOString();
    const newItem: TableData = {
      id: Date.now().toString(),
      item_key: key,
      item_value: value,
      created_at: timestamp
    };
    
    // Update existing item or add new one
    const existingIndex = tableData.findIndex(item => item.item_key === key);
    if (existingIndex >= 0) {
      tableData[existingIndex] = newItem;
    } else {
      tableData.push(newItem);
    }
    
    // Save back to localStorage
    localStorage.setItem(tableName, JSON.stringify(tableData));
    
    return newItem;
  } catch (error) {
    console.error(`[STORAGE] Error storing item in ${tableType}:`, error);
    throw error;
  }
};

export const getItem = async (tableType: TableType, key: string): Promise<TableData | null> => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const address = localStorage.getItem('userAddress');
    if (!address) {
      return null;
    }

    const tableName = generateTableName(tableType, address);
    const existingData = localStorage.getItem(tableName);
    
    if (!existingData) {
      return null;
    }
    
    try {
      const tableData: TableData[] = JSON.parse(existingData);
      const item = tableData.find(item => item.item_key === key);
      return item || null;
    } catch (e) {
      console.error(`[STORAGE] Error parsing data for ${tableName}:`, e);
      return null;
    }
  } catch (error) {
    console.error(`[STORAGE] Error getting item from ${tableType}:`, error);
    return null;
  }
};

export const listItems = async (tableType: TableType): Promise<TableData[]> => {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const address = localStorage.getItem('userAddress');
    if (!address) {
      console.log(`[STORAGE] Final resolver with 0 items for ${tableType}`);
      return [];
    }

    const tableName = generateTableName(tableType, address);
    const existingData = localStorage.getItem(tableName);
    
    if (!existingData) {
      console.log(`[STORAGE] Final resolver with 0 items for ${tableType}`);
      return [];
    }
    
    try {
      const tableData: TableData[] = JSON.parse(existingData);
      console.log(`[STORAGE] Final resolver with ${tableData.length} items for ${tableType}`);
      return tableData;
    } catch (e) {
      console.error(`[STORAGE] Error parsing data for ${tableName}:`, e);
      console.log(`[STORAGE] Final resolver with 0 items for ${tableType}`);
      return [];
    }
  } catch (error) {
    console.error(`[STORAGE] Error listing items from ${tableType}:`, error);
    console.log(`[STORAGE] Final resolver with 0 items for ${tableType}`);
    return [];
  }
};

export const deleteItem = async (tableType: TableType, key: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const address = localStorage.getItem('userAddress');
    if (!address) {
      return false;
    }

    const tableName = generateTableName(tableType, address);
    const existingData = localStorage.getItem(tableName);
    
    if (!existingData) {
      return false;
    }
    
    try {
      const tableData: TableData[] = JSON.parse(existingData);
      const originalLength = tableData.length;
      const filteredData = tableData.filter(item => item.item_key !== key);
      
      if (filteredData.length === originalLength) {
        // Item wasn't found
        return false;
      }
      
      localStorage.setItem(tableName, JSON.stringify(filteredData));
      return true;
    } catch (e) {
      console.error(`[STORAGE] Error parsing data for ${tableName}:`, e);
      return false;
    }
  } catch (error) {
    console.error(`[STORAGE] Error deleting item from ${tableType}:`, error);
    return false;
  }
};

// Debug logging functions to maintain compatibility
export const getDebugLogs = async (): Promise<string[]> => {
  // Simple implementation that returns browser storage stats
  const logs: string[] = [];
  
  try {
    // Get basic storage stats
    if (typeof window !== 'undefined') {
      const storageKeys = Object.keys(localStorage);
      logs.push(`Total localStorage keys: ${storageKeys.length}`);
      
      // Get table-specific info
      const tableKeys = storageKeys.filter(key => key.startsWith('wot_id_'));
      logs.push(`wot.id storage keys: ${tableKeys.length}`);
      
      // Add size information
      let totalSize = 0;
      tableKeys.forEach(key => {
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;
      });
      
      logs.push(`Total storage size: ${(totalSize / 1024).toFixed(2)} KB`);
    }
  } catch (e) {
    logs.push(`Error getting debug logs: ${e}`);
  }
  
  return logs;
};

// Storage debugging functions
export const getStorageLogs = getDebugLogs;
export const exportStorageLogs = async (): Promise<string> => {
  const logs = await getDebugLogs();
  return JSON.stringify(logs);
};
