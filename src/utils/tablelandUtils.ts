import { Database } from '@tableland/sdk';
import { optimism } from '@reown/appkit/networks';
import { getWalletClient } from '@wagmi/core';

// Maximum number of retry attempts for blockchain transactions
const MAX_RETRY_ATTEMPTS = 3;

// Delay between retry attempts in milliseconds (exponential backoff)
const RETRY_DELAY_BASE = 1000; // 1 second

// Interface for table data
export interface TableData {
  id: number;
  key: string;      // This maps to item_key in the database
  value: string;    // This maps to item_value in the database
  created_at: string;
}

// Alias for TableData to maintain compatibility with existing code
export type PrivateData = TableData;

// Enum for table types to ensure consistency
export enum TableType {
  PRIVATE = 'private',
  MEDICAL = 'medical',
  ACCOUNTS = 'accounts',
  CONTACTS = 'contacts',
  AFFILIATIONS = 'affiliations',
  CURRENCIES = 'currencies',
  DIGITAL_ASSETS = 'digital_assets',
  CHAT = 'chat'
}

// Utility function to execute a database operation with retry logic
export const executeWithRetry = async <T>(operation: () => Promise<T>, tableType: TableType): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed for ${tableType} operation:`, error);
      
      // If this is the last attempt, don't delay, just throw
      if (attempt === MAX_RETRY_ATTEMPTS) break;
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

// Utility function to validate and sanitize input strings
export const sanitizeInput = (input: string): string => {
  if (input === undefined || input === null) {
    throw new Error('Input cannot be null or undefined');
  }
  
  // Replace single quotes with two single quotes to escape them in SQL
  return input.replace(/'/g, "''");
};

// Initialize Tableland database with Optimism chain
// This function is kept for backwards compatibility
// New code should use initTablelandWithOptimismWrite from optimismProvider.ts
export const initTableland = async (): Promise<Database> => {
  try {
    // Import dynamically to avoid circular dependencies
    const { initTablelandWithOptimismWrite } = await import('./optimismProvider');
    return await initTablelandWithOptimismWrite('');
  } catch (error) {
    console.error('Error initializing Tableland:', error);
    throw error;
  }
};

// Generic function to create a table
export const createTable = async (db: Database, tableType: TableType, address: string): Promise<string> => {
  return executeWithRetry(async () => {
    // Create a real Tableland table with the appropriate schema
    // All tables have the same schema: id, item_key, item_value, created_at
    // Note: We're using item_key instead of key because key is a reserved SQL keyword
    const prefix = address.toLowerCase().slice(2, 10); // Remove 0x and take 8 chars
    const tableName = `${tableType}_${prefix}`;
    
    const { meta: create } = await db.prepare(`
      CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY,
        item_key TEXT NOT NULL,
        item_value TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run();
    
    // Wait for transaction to complete
    await create.txn?.wait();
    
    // Return the actual table name from Tableland
    return create.txn?.name || tableName;
  }, tableType);
};

// Generic function to insert data into a table
export const insertData = async (
  db: Database, 
  tableType: TableType, 
  tableName: string, 
  key: string, 
  value: string
): Promise<void> => {
  return executeWithRetry(async () => {
    // Validate inputs to prevent SQL injection
    if (!key || !value) {
      throw new Error('Key and value must not be empty');
    }
    
    // Sanitize inputs using our utility function
    const sanitizedKey = sanitizeInput(key);
    const sanitizedValue = sanitizeInput(value);
    const timestamp = new Date().toISOString();
    
    // Insert data into the Tableland table
    // Using item_key and item_value instead of key and value (reserved keywords)
    const { meta: insert } = await db.prepare(`
      INSERT INTO ${tableName} (item_key, item_value, created_at)
      VALUES ('${sanitizedKey}', '${sanitizedValue}', '${timestamp}')
    `).run();
    
    // Wait for transaction to complete
    await insert.txn?.wait();
  }, tableType);
};

// Generic function to get data from a table
export const getData = async (db: Database, tableType: TableType, tableName: string): Promise<TableData[]> => {
  try {
    // Query data from the Tableland table
    // Using item_key and item_value in the query, but mapping to key and value in the result
    const { results } = await db.prepare(`
      SELECT id, item_key as key, item_value as value, created_at FROM ${tableName} ORDER BY id ASC
    `).all<TableData>();
    
    return results;
  } catch (error) {
    console.error(`Error getting data from ${tableType} table:`, error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

// Generic function to check if a table exists
export const checkTableExists = async (db: Database, tableType: TableType, address: string): Promise<{exists: boolean, tableName: string}> => {
  try {
    // Format the address correctly - remove 0x prefix and use lowercase
    const prefix = address.toLowerCase().slice(2, 10);
    const expectedTablePrefix = `${tableType}_${prefix}`;
    
    // Query Tableland to list tables owned by this address
    // Using a more compatible query format
    const { results } = await db.prepare(`
      SELECT name FROM information_schema.tables
      WHERE name LIKE '${expectedTablePrefix}%'
    `).all<{name: string}>();
    
    // Check if any of the tables match our expected name pattern
    const exists = results.length > 0;
    const tableName = exists ? results[0].name : expectedTablePrefix;
    
    return { exists, tableName };
  } catch (error) {
    console.error(`Error checking if ${tableType} table exists:`, error);
    // Return false instead of throwing to prevent UI crashes
    const prefix = address.toLowerCase().slice(2, 10);
    return { exists: false, tableName: `${tableType}_${prefix}` };
  }
};

// Generic function to clear data from a table
export const clearData = async (db: Database, tableType: TableType, tableName: string): Promise<void> => {
  return executeWithRetry(async () => {
    // Delete all data from the Tableland table
    const { meta: clear } = await db.prepare(`
      DELETE FROM ${tableName}
    `).run();
    
    // Wait for transaction to complete
    await clear.txn?.wait();
  }, tableType);
};

// Backwards compatibility functions for existing code
// These functions use the generic functions above but maintain the same interface

// Private table functions
export const createPrivateTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.PRIVATE, address);
};

export const insertPrivateData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.PRIVATE, tableName, key, value);
};

export const getPrivateData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.PRIVATE, tableName);
};

export const checkPrivateTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.PRIVATE, address);
};

export const clearPrivateData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.PRIVATE, tableName);
};

// Medical table functions
export const createMedicalTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.MEDICAL, address);
};

export const insertMedicalData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.MEDICAL, tableName, key, value);
};

export const getMedicalData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.MEDICAL, tableName);
};

export const checkMedicalTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.MEDICAL, address);
};

export const clearMedicalData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.MEDICAL, tableName);
};

// Accounts table functions
export const createAccountsTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.ACCOUNTS, address);
};

export const insertAccountData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.ACCOUNTS, tableName, key, value);
};

export const getAccountsData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.ACCOUNTS, tableName);
};

export const checkAccountsTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.ACCOUNTS, address);
};

export const clearAccountsData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.ACCOUNTS, tableName);
};

// Contacts table functions
export const createContactsTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.CONTACTS, address);
};

export const insertContactData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.CONTACTS, tableName, key, value);
};

export const getContactsData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.CONTACTS, tableName);
};

export const checkContactsTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.CONTACTS, address);
};

export const clearContactsData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.CONTACTS, tableName);
};

// Affiliations table functions
export const createAffiliationsTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.AFFILIATIONS, address);
};

export const insertAffiliationData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.AFFILIATIONS, tableName, key, value);
};

export const getAffiliationsData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.AFFILIATIONS, tableName);
};

export const checkAffiliationsTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.AFFILIATIONS, address);
};

export const clearAffiliationsData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.AFFILIATIONS, tableName);
};

// Currencies table functions
export const createCurrenciesTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.CURRENCIES, address);
};

export const insertCurrencyData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.CURRENCIES, tableName, key, value);
};

export const getCurrenciesData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.CURRENCIES, tableName);
};

export const checkCurrenciesTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.CURRENCIES, address);
};

export const clearCurrenciesData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.CURRENCIES, tableName);
};

// Digital Assets table functions
export const createDigitalAssetsTable = async (db: Database, address: string): Promise<{tableName: string}> => {
  return executeWithRetry(async () => {
    // Create a real Tableland table with the appropriate schema for digital assets
    // Digital assets table has a slightly different schema with no key field
    // Format the address correctly - remove 0x prefix and use lowercase
    const prefix = address.toLowerCase().slice(2, 10);
    const tableName = `${TableType.DIGITAL_ASSETS}_${prefix}`;
    
    const { meta: create } = await db.prepare(`
      CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY,
        asset_value TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run();
    
    // Wait for transaction to complete
    await create.txn?.wait();
    
    // Return the actual table name from Tableland
    return { tableName: create.txn?.name || tableName };
  }, TableType.DIGITAL_ASSETS);
};

export const insertDigitalAssetData = async (db: Database, tableName: string, value: string): Promise<void> => {
  return executeWithRetry(async () => {
    // Validate inputs to prevent SQL injection
    if (!value) {
      throw new Error('Value must not be empty');
    }
    
    // Sanitize inputs using our utility function
    const sanitizedValue = sanitizeInput(value);
    const timestamp = new Date().toISOString();
    
    // Insert data into the Tableland table (digital assets table has no key field)
    // Using asset_value instead of value (reserved keyword)
    const { meta: insert } = await db.prepare(`
      INSERT INTO ${tableName} (asset_value, created_at)
      VALUES ('${sanitizedValue}', '${timestamp}')
    `).run();
    
    // Wait for transaction to complete
    await insert.txn?.wait();
  }, TableType.DIGITAL_ASSETS);
};

export const getDigitalAssetsData = async (db: Database, tableName: string): Promise<TableData[]> => {
  try {
    // Query data from the Tableland table
    // Digital assets table has a different schema with no key field
    // Using asset_value in the query, but mapping to value in the result
    const { results } = await db.prepare(`
      SELECT id, '' as key, asset_value as value, created_at FROM ${tableName} ORDER BY id ASC
    `).all<TableData>();
    
    return results;
  } catch (error) {
    console.error(`Error getting data from digital assets table:`, error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

export const checkDigitalAssetsTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.DIGITAL_ASSETS, address);
};

export const clearDigitalAssetsData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.DIGITAL_ASSETS, tableName);
};

// Chat table functions
export const createChatTable = async (db: Database, address: string): Promise<string> => {
  return createTable(db, TableType.CHAT, address);
};

export const insertChatData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
  return insertData(db, TableType.CHAT, tableName, key, value);
};

export const getChatData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.CHAT, tableName);
};

export const checkChatTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  return checkTableExists(db, TableType.CHAT, address);
};

export const clearChatData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.CHAT, tableName);
};
