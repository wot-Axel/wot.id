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

// Enhanced logging utility for debugging
const DEBUG_MODE = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[TABLELAND UTILS ${timestamp}]`;
    if (data) {
      console.log(logPrefix, message, data);
    } else {
      console.log(logPrefix, message);
    }
    
    // Add to debug log in localStorage for retrieval
    try {
      if (typeof window !== 'undefined') {
        const existingLogs = localStorage.getItem('tableland_utils_logs') || '[]';
        const logs = JSON.parse(existingLogs);
        logs.push({ timestamp, message, data: data ? JSON.stringify(data) : undefined });
        // Keep only the last 100 logs to prevent localStorage from getting too large
        if (logs.length > 100) {
          logs.shift();
        }
        localStorage.setItem('tableland_utils_logs', JSON.stringify(logs));
      }
    } catch (e) {
      console.error('Failed to save debug log to localStorage:', e);
    }
  }
};

// Utility function to retrieve all debug logs
export const getTablelandDebugLogs = () => {
  if (typeof window === 'undefined') return { utils: [], context: [] };
  
  try {
    const utilsLogs = localStorage.getItem('tableland_utils_logs') || '[]';
    const contextLogs = localStorage.getItem('tableland_debug_logs') || '[]';
    return {
      utils: JSON.parse(utilsLogs),
      context: JSON.parse(contextLogs)
    };
  } catch (e) {
    console.error('Failed to retrieve debug logs:', e);
    return { utils: [], context: [] };
  }
};

// Function to export logs to console for easy copying
export const exportTablelandLogs = () => {
  if (typeof window === 'undefined') return;
  
  const logs = getTablelandDebugLogs();
  console.log('========== TABLELAND DEBUG LOGS ==========');
  console.log(JSON.stringify(logs, null, 2));
  console.log('=========================================');
  return logs;
};

// Utility function to execute a database operation with retry logic
export const executeWithRetry = async <T>(operation: () => Promise<T>, tableType: TableType): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      debugLog(`Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for ${tableType} operation`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog(`Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed for ${tableType} operation: ${errorMessage}`, error);
      console.error(`Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed for ${tableType} operation:`, error);
      
      // If this is the last attempt, don't delay, just throw
      if (attempt === MAX_RETRY_ATTEMPTS) break;
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      debugLog(`Retrying after ${delay}ms delay`);
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
export const initTableland = async (): Promise<Database> => {
  // Skip initialization on server-side
  if (typeof window === 'undefined') {
    debugLog('Server-side rendering detected, skipping Tableland initialization');
    console.log('Server-side rendering detected, skipping Tableland initialization');
    throw new Error('Tableland initialization is not supported during server-side rendering');
  }
  
  // Maximum number of retries for Ethereum provider
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Retry loop for Ethereum provider
  while (retryCount < MAX_RETRIES) {
    try {
      debugLog(`Starting Tableland initialization (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Check if window.ethereum is available
      if (typeof window.ethereum === 'undefined') {
        // Wait a moment and try again - the provider might be initializing
        debugLog('Ethereum provider not found, waiting 500ms before retry...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again after waiting
        if (typeof window.ethereum === 'undefined') {
          const errorMsg = 'No Ethereum provider found. Please install a wallet like MetaMask.';
          debugLog(errorMsg);
          lastError = new Error(errorMsg);
          retryCount++;
          continue; // Try again
        }
      }
      
      // Provider is available
      debugLog('Ethereum provider detected', { 
        provider: typeof window.ethereum,
        isMetaMask: window.ethereum.isMetaMask,
        chainId: window.ethereum.chainId
      });
      
      // Create a new instance of Database with default options
      // This will use the connected wallet's address automatically
      debugLog('Creating new Database instance');
      const db = new Database();
      
      // Verify the database instance
      if (!db) {
        throw new Error('Database instance creation failed');
      }
      
      // Log database instance details
      debugLog('Database instance created successfully', {
        dbType: typeof db,
        hasProperties: db ? Object.keys(db) : 'none'
      });
      
      // Add global access for debugging
      if (typeof window !== 'undefined') {
        (window as any).tablelandDb = db;
        (window as any).getTablelandLogs = exportTablelandLogs;
        (window as any).checkTablelandDb = () => {
          return {
            dbExists: !!db,
            dbType: typeof db,
            properties: db ? Object.keys(db) : 'none',
            methods: db ? Object.getOwnPropertyNames(Object.getPrototypeOf(db)) : 'none'
          };
        };
      }
      
      // Success - return the database instance
      return db;
    } catch (error) {
      // Log the error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog(`Error initializing Tableland (attempt ${retryCount + 1}/${MAX_RETRIES}): ${errorMessage}`, error);
      console.error(`Error initializing Tableland (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // Store the error for potential re-throw
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Increment retry counter
      retryCount++;
      
      // Wait longer between retries
      if (retryCount < MAX_RETRIES) {
        const waitTime = 1000 * retryCount; // Exponential backoff
        debugLog(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  debugLog('All initialization attempts failed');
  throw lastError || new Error('Failed to initialize Tableland after multiple attempts');
};

// Generic function to create a table
export const createTable = async (db: Database, tableType: TableType, address: string): Promise<string> => {
  return executeWithRetry(async () => {
    // Skip if we're on the server side
    if (typeof window === 'undefined') {
      debugLog(`Server-side rendering detected, skipping table creation for ${tableType}`);
      console.log('Server-side rendering detected, skipping table creation');
      return `${tableType}_placeholder`;
    }
    
    debugLog(`Creating table for ${tableType} with address ${address}`, { dbExists: !!db });
    
    try {
      // Create a real Tableland table with the appropriate schema
      // All tables have the same schema: id, item_key, item_value, created_at
      // Note: We're using item_key instead of key because key is a reserved SQL keyword
      
      // Ensure address is properly formatted
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
      // Always use lowercase for the prefix to ensure consistency
      const prefix = cleanAddress.toLowerCase().slice(0, 8); // Take first 8 chars
      
      // Ensure tableName follows Tableland naming conventions
      // Tableland requires lowercase names with format tablename_chainid_uniqueid
      const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      // Use Optimism (Chain ID 10) for all Tableland operations
      // This is our strategic decision to benefit from lower gas costs
      const chainId = 10; // Optimism
      
      // Always use lowercase for the entire table name to ensure consistency
      // Format: tablename_chainid_addressprefix
      const tableName = `${safeTableType}_${chainId}_${prefix}`.toLowerCase();
      
      // Create the table
      debugLog(`Preparing to create table ${tableName} with SQL statement`);
      const createStatement = `
        CREATE TABLE ${tableName} (
          id INTEGER PRIMARY KEY,
          item_key TEXT NOT NULL,
          item_value TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `;
      debugLog(`SQL statement for table creation: ${createStatement}`);
      
      const createResult = await db.prepare(createStatement).run();
      debugLog(`Table creation result:`, createResult);
      
      // Safely access the meta property
      const meta = createResult?.meta;
      debugLog(`Table creation meta:`, meta);
      
      // Wait for transaction to complete if it exists
      if (meta?.txn) {
        // Avoid accessing hash property directly as it may not exist on all transaction types
        const txInfo = meta.txn ? JSON.stringify(meta.txn).substring(0, 100) : 'no transaction info';
        debugLog(`Waiting for transaction to complete: ${txInfo}...`);
        await meta.txn.wait();
        debugLog(`Transaction completed for table creation`);
      } else {
        debugLog(`No transaction to wait for in table creation`);
      }
      
      // Return the actual table name from Tableland or fall back to our constructed name
      // Always ensure the returned table name is lowercase
      return ((meta?.txn?.name) || tableName).toLowerCase();
    } catch (error) {
      console.error(`Error creating table for ${tableType}:`, error);
      // Return a fallback name in case of error
      const fallbackPrefix = address ? (address.startsWith('0x') ? address.slice(2, 10) : address.slice(0, 8)).toLowerCase() : 'error';
      const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      // Use Optimism (Chain ID 10) for all Tableland operations
      // This is our strategic decision to benefit from lower gas costs
      const chainId = 10; // Optimism
      
      return `${safeTableType}_${chainId}_${fallbackPrefix}`.toLowerCase();
    }
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
    debugLog(`Inserting data into ${tableType} table ${tableName}`, { keyLength: key?.length, valueLength: value?.length });
    
    // Validate inputs to prevent SQL injection
    if (!key || !value) {
      const errorMsg = 'Key and value must not be empty';
      debugLog(`Validation error: ${errorMsg}`, { key, value });
      throw new Error(errorMsg);
    }
    
    // Sanitize inputs using our utility function
    const sanitizedKey = sanitizeInput(key);
    const sanitizedValue = sanitizeInput(value);
    const timestamp = new Date().toISOString();
    
    // Ensure tableName follows Tableland naming conventions
    // Always convert to lowercase to ensure consistency
    const safeTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Insert data into the Tableland table with the new format (with chain ID 10)
    debugLog(`Inserting into table ${safeTableName}`);
    const { meta: insert } = await db.prepare(`
      INSERT INTO ${safeTableName} (item_key, item_value, created_at)
      VALUES ('${sanitizedKey}', '${sanitizedValue}', '${timestamp}')
    `).run();
    
    // Wait for transaction to complete
    await insert.txn?.wait();
    debugLog(`Successfully inserted data into table ${safeTableName}`);
  }, tableType);
};

// Generic function to get data from a table
export const getData = async (db: Database, tableType: TableType, tableName: string): Promise<TableData[]> => {
  // Skip if we're on the server side
  if (typeof window === 'undefined') {
    debugLog(`Server-side rendering detected, skipping getData for ${tableType}`);
    console.log('Server-side rendering detected, skipping getData');
    return [];
  }
  
  debugLog(`Getting data for ${tableType} from table ${tableName}`, { dbExists: !!db });
  
  // Validate inputs
  if (!db) {
    console.error('Database instance is null or undefined');
    return [];
  }
  
  if (!tableName) {
    console.error('Table name is null or undefined');
    return [];
  }
  
  try {
    // Ensure tableName follows Tableland naming conventions
    // Tableland requires lowercase names with only alphanumeric characters and underscores
    // Always convert to lowercase to ensure consistency
    const safeTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Query data from the Tableland table with the new format (with chain ID 10)
    debugLog(`Executing query on table ${safeTableName}`);
    const queryResult = await db.prepare(`
      SELECT id, item_key, item_value, created_at FROM ${safeTableName} ORDER BY id ASC
    `).all<{id: number, item_key: string, item_value: string, created_at: string}>();
    
    // Log the structure of queryResult to help debug
    debugLog(`Query result structure: ${JSON.stringify(Object.keys(queryResult || {}))}`);
    
    // Handle different response structures from Tableland SDK
    let results: Array<{id: number, item_key: string, item_value: string, created_at: string} | any> = [];
    
    // Check if queryResult is an array directly
    if (Array.isArray(queryResult)) {
      debugLog('Query result is an array directly');
      results = queryResult;
    }
    // Check if queryResult has a results property that is an array
    else if (queryResult && Array.isArray((queryResult as any).results)) {
      debugLog('Query result has a results array property');
      results = (queryResult as any).results;
    }
    // Check if queryResult has a rows property that is an array (some versions use this)
    else if (queryResult && 'rows' in queryResult && Array.isArray((queryResult as any).rows)) {
      debugLog('Query result has a rows array property');
      results = (queryResult as any).rows;
    }
    // Check if queryResult has a data property that is an array (some versions use this)
    else if (queryResult && 'data' in queryResult && Array.isArray((queryResult as any).data)) {
      debugLog('Query result has a data array property');
      results = (queryResult as any).data;
    }
    // If we can't determine the structure, log it and return empty array
    else {
      debugLog(`Unable to determine query result structure: ${JSON.stringify(queryResult)}`);
      results = [];
    }
    
    debugLog(`Found ${results.length} results`);
    
    // Map the results to match the TableData interface
    const mappedResults = results.map((item: {id?: number, item_key?: string, item_value?: string, created_at?: string} | null | undefined) => {
      // Handle potential missing properties safely
      if (!item) return { id: 0, key: '', value: '', created_at: new Date().toISOString() };
      
      return {
        id: typeof item.id === 'number' ? item.id : 0,
        key: item.item_key || '',
        value: item.item_value || '',
        created_at: item.created_at || new Date().toISOString()
      };
    });
    
    return mappedResults;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLog(`Error getting data from ${tableType} table: ${errorMessage}`, error);
    console.error(`Error getting data from ${tableType} table:`, error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

// Generic function to check if a table exists
export const checkTableExists = async (db: Database, tableType: TableType, address: string): Promise<{exists: boolean, tableName: string}> => {
  // Skip if we're on the server side
  if (typeof window === 'undefined') {
    debugLog(`Server-side rendering detected, skipping table check for ${tableType}`);
    console.log('Server-side rendering detected, skipping table check');
    // Return a default response for server-side rendering
    return { exists: false, tableName: `${tableType}_placeholder` };
  }
  
  // Validate inputs
  if (!db) {
    debugLog(`Database instance is null or undefined for ${tableType} table check`);
    console.error('Database instance is null or undefined');
    return { exists: false, tableName: `${tableType}_error` };
  }
  
  if (!address) {
    debugLog(`Address is null or undefined for ${tableType} table check`);
    console.error('Address is null or undefined');
    return { exists: false, tableName: `${tableType}_error` };
  }
  
  debugLog(`Starting table existence check for ${tableType} with address ${address}`, {
    dbType: typeof db,
    hasProperties: db ? Object.keys(db) : 'none'
  });
  
  try {
    // Format the address correctly - remove 0x prefix and use lowercase
    // Handle case where address might not start with 0x
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    // Always use lowercase for the prefix to ensure consistency
    const prefix = cleanAddress.toLowerCase().slice(0, 8); // Take first 8 chars
    
    // Ensure tableName follows Tableland naming conventions
    // Tableland requires lowercase names with format tablename_chainid_uniqueid
    const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Use Optimism (Chain ID 10) for all Tableland operations
    // This is our strategic decision to benefit from lower gas costs
    const chainId = 10; // Optimism
    
    // Format: tablename_chainid_addressprefix
    const tableName = `${safeTableType}_${chainId}_${prefix}`.toLowerCase();
    
    debugLog(`Constructed table name for check: ${tableName} for type ${tableType} and address ${address}`);
    
    try {
      // Check if the table exists by trying to query it
      // This will throw an error if the table doesn't exist
      debugLog(`Preparing to query table ${tableName} to check existence`);
      const sqlQuery = `SELECT * FROM ${tableName} LIMIT 1`;
      debugLog(`SQL query for table check: ${sqlQuery}`);
      
      const result = await db.prepare(sqlQuery).all();
      const hasResults = result?.results?.length > 0;
      
      debugLog(`Table ${tableName} exists, query returned results: ${hasResults}`, result);
      
      // If we get here, the table exists
      return { exists: true, tableName };
    } catch (queryError) {
      // Extract error message
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      
      // Log detailed error information
      debugLog(`Error checking if table ${tableName} exists: ${errorMessage}`, queryError);
      
      // Check if the error is specifically about the table not existing
      const isTableNotFoundError = 
        errorMessage.includes('does not exist') || 
        errorMessage.includes('no such table') ||
        errorMessage.includes('not found');
      
      if (isTableNotFoundError) {
        debugLog(`Table ${tableName} confirmed not to exist (expected error)`);
      } else {
        debugLog(`Unexpected error during table check for ${tableName}: ${errorMessage}`);
      }
      
      console.log(`Table ${tableName} does not exist:`, queryError);
      return { exists: false, tableName };
    }
  } catch (error) {
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLog(`Unexpected error in checkTableExists for ${tableType}: ${errorMessage}`, error);
    console.error(`Error checking if table ${tableType} exists:`, error);
    
    // Ensure we return a valid tableName even in error case
    let tableName = `${tableType}_error`;
    if (address && typeof address === 'string') {
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
      const prefix = cleanAddress.toLowerCase().slice(0, 8);
      const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
      tableName = `${safeTableType}_${prefix}`;
    }
    
    debugLog(`Returning fallback table name: ${tableName}`);
    return { exists: false, tableName };
  }
};

// Generic function to clear data from a table
export const clearData = async (db: Database, tableType: TableType, tableName: string): Promise<void> => {
  return executeWithRetry(async () => {
    // Delete all data from the table
    const { meta: clear } = await db.prepare(`
      DELETE FROM ${tableName}
    `).run();
    
    // Wait for transaction to complete
    await clear.txn?.wait();
  }, tableType);
};

// Private data table functions
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

// Medical data table functions
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

export const insertAccountsData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
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

export const insertContactsData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
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

export const insertAffiliationsData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
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

export const insertCurrenciesData = async (db: Database, tableName: string, key: string, value: string): Promise<void> => {
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
    const { results } = await db.prepare(`
      SELECT id, asset_value, created_at FROM ${tableName} ORDER BY id ASC
    `).all<{id: number, asset_value: string, created_at: string}>();
    
    // Map the results to match the TableData interface
    const mappedResults = results.map(item => ({
      id: item.id,
      key: '',  // Digital assets don't use keys
      value: item.asset_value,
      created_at: item.created_at
    }));
    
    return mappedResults;
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
