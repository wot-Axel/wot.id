// src/utils/storageUtils.ts
// Compatibility layer redirecting to Gun.js implementation

// Maintain the same types to prevent breaking changes
export enum TableType {
  PRIVATE = 'private',
  CONTACTS = 'contacts',
  DIGITAL_ASSETS = 'digital_assets',
  MEDICAL = 'medical',
  AFFILIATIONS = 'affiliations',
  CHAT = 'chat'
}

export interface TableData {
  id: string;
  item_key: string;
  item_value: string;
  created_at: string;
}

// Import Gun.js utils for actual implementation
import { 
  initGun, 
  getGun, 
  storeGunItem, 
  getGunItem, 
  listGunItems, 
  deleteGunItem 
} from './gunUtils';

export interface PrivateData extends TableData {
  // Any specific fields from the original interface
}

// Forward to Gun.js implementation
export const storeItem = async (tableType: TableType, key: string, value: string): Promise<TableData> => {
  try {
    return await storeGunItem(tableType, key, value);
  } catch (error) {
    console.error(`[STORAGE] Error storing item in ${tableType}:`, error);
    throw error;
  }
};

export const getItem = async (tableType: TableType, key: string): Promise<TableData | null> => {
  try {
    return await getGunItem(tableType, key);
  } catch (error) {
    console.error(`[STORAGE] Error getting item from ${tableType}:`, error);
    throw error;
  }
};

export const listItems = async (tableType: TableType): Promise<TableData[]> => {
  try {
    return await listGunItems(tableType);
  } catch (error) {
    console.error(`[STORAGE] Error listing items from ${tableType}:`, error);
    throw error;
  }
};

export const deleteItem = async (tableType: TableType, key: string): Promise<boolean> => {
  try {
    return await deleteGunItem(tableType, key);
  } catch (error) {
    console.error(`[STORAGE] Error deleting item from ${tableType}:`, error);
    throw error;
  }
};

// Debug logging functions to maintain compatibility
export const getGunDebugLogs = async (): Promise<string[]> => {
  return ["Log data available through Gun.js"];
};

export const exportGunLogs = async (): Promise<string> => {
  return "Gun.js logs exported";
};
