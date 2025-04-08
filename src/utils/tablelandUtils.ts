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
export const initTableland = async (forceAddress?: string): Promise<Database> => {
  console.log('[TABLELAND] Starting Tableland initialization');
  
  // Import here to avoid circular dependencies
  const { getStoredCorrectAddress } = require('./addressUtils');
  
  // If no force address is provided, try to get the stored correct address
  if (!forceAddress) {
    const storedAddress = getStoredCorrectAddress();
    if (storedAddress) {
      console.log(`[TABLELAND] Using stored correct address: ${storedAddress}`);
      forceAddress = storedAddress;
    }
  }
  
  // Skip initialization on server-side
  if (typeof window === 'undefined') {
    debugLog('Server-side rendering detected, skipping Tableland initialization');
    console.log('[TABLELAND] Server-side rendering detected, skipping Tableland initialization');
    throw new Error('Tableland initialization is not supported during server-side rendering');
  }
  
  // Maximum number of retries for Ethereum provider
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Retry loop for Ethereum provider
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[TABLELAND] Starting Tableland initialization (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      debugLog(`Starting Tableland initialization (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Check if window.ethereum is available
      if (typeof window.ethereum === 'undefined') {
        // Wait a moment and try again - the provider might be initializing
        console.log('[TABLELAND] Ethereum provider not found, waiting 500ms before retry...');
        debugLog('Ethereum provider not found, waiting 500ms before retry...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again after waiting
        if (typeof window.ethereum === 'undefined') {
          const errorMsg = 'No Ethereum provider found. Please install a wallet like MetaMask.';
          console.error(`[TABLELAND ERROR] ${errorMsg}`);
          debugLog(errorMsg);
          lastError = new Error(errorMsg);
          retryCount++;
          continue; // Try again
        }
      }
      
      // Provider is available
      console.log('[TABLELAND] Ethereum provider detected', { 
        provider: typeof window.ethereum,
        isMetaMask: window.ethereum.isMetaMask,
        chainId: window.ethereum.chainId
      });
      debugLog('Ethereum provider detected', { 
        provider: typeof window.ethereum,
        isMetaMask: window.ethereum.isMetaMask,
        chainId: window.ethereum.chainId
      });
      
      // Create a new instance of Database with default options
      // This will use the connected wallet's address automatically
      console.log('[TABLELAND] Creating new Database instance');
      debugLog('Creating new Database instance');
      
      try {
        // Create database with specific options if address is provided
        let db: Database;
        
        // For now, we'll create a standard database without custom options
        // This will allow us to perform read operations
        console.log('[TABLELAND] Creating standard Database instance');
        debugLog('Creating standard Database instance');
        
        // Create a standard database
        db = new Database();
        
        if (forceAddress) {
          console.log(`[TABLELAND] Will use forced address for table operations: ${forceAddress}`);
          debugLog(`Will use forced address for table operations: ${forceAddress}`);
        } else {
          console.log('[TABLELAND] Using default address for table operations');
          debugLog('Using default address for table operations');
        }
        
        // Verify the database instance
        if (!db) {
          const errorMsg = 'Database instance creation failed';
          console.error(`[TABLELAND ERROR] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // Log database instance details
        console.log('[TABLELAND] Database instance created successfully', {
          dbType: typeof db,
          hasProperties: db ? Object.keys(db) : 'none',
          methods: db ? Object.getOwnPropertyNames(Object.getPrototypeOf(db)).slice(0, 10) : 'none'
        });
        debugLog('Database instance created successfully', {
          dbType: typeof db,
          hasProperties: db ? Object.keys(db) : 'none'
        });
        
        // Add global access for debugging
        if (typeof window !== 'undefined') {
          console.log('[TABLELAND] Adding global debugging helpers');
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
        console.log('[TABLELAND] Database initialization completed successfully');
        return db;
      } catch (dbCreationError) {
        const errorMsg = dbCreationError instanceof Error ? dbCreationError.message : String(dbCreationError);
        console.error(`[TABLELAND ERROR] Failed to create Database instance: ${errorMsg}`, {
          stack: dbCreationError instanceof Error ? dbCreationError.stack : 'No stack trace'
        });
        throw dbCreationError;
      }
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
  console.error('[TABLELAND ERROR] All initialization attempts failed');
  debugLog('All initialization attempts failed');
  throw lastError || new Error('Failed to initialize Tableland after multiple attempts');
};

// Generic function to create a table
export const createTable = async (db: Database, tableType: TableType, address: string): Promise<string> => {
  return executeWithRetry(async () => {
    // Skip if we're on the server side
    if (typeof window === 'undefined') {
      debugLog(`Server-side rendering detected, skipping table creation for ${tableType}`);
      console.log('[TABLELAND] Server-side rendering detected, skipping table creation');
      return `${tableType}_placeholder`;
    }
    
    console.log(`[TABLELAND] Creating table for ${tableType} with address ${address}`);
    debugLog(`Creating table for ${tableType} with address ${address}`, { dbExists: !!db });
    
    // Validate database connection
    if (!db) {
      const errorMsg = 'Database instance is null or undefined';
      console.error(`[TABLELAND ERROR] ${errorMsg}`);
      debugLog(`Validation error: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Check if the prepare method exists
    if (typeof db.prepare !== 'function') {
      const errorMsg = 'Database instance does not have a prepare method';
      console.error(`[TABLELAND ERROR] ${errorMsg}`, { dbType: typeof db, methods: Object.keys(db) });
      debugLog(`Validation error: ${errorMsg}`, { dbType: typeof db, methods: Object.keys(db) });
      throw new Error(errorMsg);
    }
    
    try {
      // Create a real Tableland table with the appropriate schema
      // All tables have the same schema: id, item_key, item_value, created_at
      // Note: We're using item_key instead of key because key is a reserved SQL keyword
      
      // Validate address
      if (!address) {
        const errorMsg = 'Address must not be empty';
        console.error(`[TABLELAND ERROR] ${errorMsg}`);
        debugLog(`Validation error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Ensure address is properly formatted
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
      // Always use lowercase for the prefix to ensure consistency
      const prefix = cleanAddress.toLowerCase().slice(0, 8); // Take first 8 chars
      
      console.log(`[TABLELAND] Processing address: ${address}, cleaned to: ${cleanAddress}, prefix: ${prefix}`);
      
      // Ensure tableName follows Tableland naming conventions
      // Tableland requires lowercase names with format tablename_chainid_uniqueid
      const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      // Use Optimism (Chain ID 10) for all Tableland operations
      // This is our strategic decision to benefit from lower gas costs
      const chainId = 10; // Optimism
      
      // For table creation, we only specify the prefix and let Tableland append the chainId and tableId
      // Format: tablename (Tableland will append _chainid_tableid automatically)
      const tablePrefix = `${safeTableType}`.toLowerCase();
      
      console.log(`[TABLELAND] Using table prefix: ${tablePrefix}`);
      
      // Create the table
      debugLog(`Preparing to create table with prefix ${tablePrefix} with SQL statement`);
      const createStatement = `
        CREATE TABLE ${tablePrefix} (
          id INTEGER PRIMARY KEY,
          item_key TEXT NOT NULL,
          item_value TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `;
      console.log(`[TABLELAND] SQL statement for table creation: ${createStatement}`);
      debugLog(`SQL statement for table creation: ${createStatement}`);
      
      try {
        console.log(`[TABLELAND] Executing table creation query`);
        const createResult = await db.prepare(createStatement).run();
        console.log(`[TABLELAND] Table creation result:`, createResult);
        debugLog(`Table creation result:`, createResult);
        
        // If we get here, the table was created successfully
        return createResult?.meta?.txn?.name || `${tablePrefix}_10_mockdev`;
      } catch (error) {
        // Check if this is the mock provider error
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('eth_blockNumber not implemented in mock provider')) {
          // We're in a development environment with a mock provider
          // Create a mock table name for development purposes
          console.log(`[TABLELAND] Mock provider detected, using development table name`);
          const mockTableName = `${tablePrefix}_10_mockdev`;
          console.log(`[TABLELAND] Using mock table name: ${mockTableName}`);
          return mockTableName;
        } else {
          // This is a different error, rethrow it
          throw error;
        }
      }
      
      // This code should not be reached because we're returning from the try/catch block above
      // It's left here for reference but will be removed in a future update
      
      // The table name should have been returned from the try/catch block above
      // This code should not be reached
      throw new Error('Unexpected code path in createTable function');
      
    } catch (error) {
      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[TABLELAND ERROR] Failed to create table for ${tableType}:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        tableType,
        address
      });
      debugLog(`Error creating table for ${tableType}: ${errorMessage}`, error);
      
      // In case of error, we can't create a valid Tableland table name
      // Just throw the error and let the caller handle it
      throw error;
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
    try {
      console.log(`[TABLELAND] Inserting data into ${tableType} table ${tableName}`, { keyLength: key?.length, valueLength: value?.length });
      debugLog(`Inserting data into ${tableType} table ${tableName}`, { keyLength: key?.length, valueLength: value?.length });
      
      // Validate database connection
      if (!db) {
        const errorMsg = 'Database instance is null or undefined';
        console.error(`[TABLELAND ERROR] ${errorMsg}`);
        debugLog(`Validation error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Check if the prepare method exists
      if (typeof db.prepare !== 'function') {
        const errorMsg = 'Database instance does not have a prepare method';
        console.error(`[TABLELAND ERROR] ${errorMsg}`, { dbType: typeof db, methods: Object.keys(db) });
        debugLog(`Validation error: ${errorMsg}`, { dbType: typeof db, methods: Object.keys(db) });
        throw new Error(errorMsg);
      }
      
      // Validate inputs to prevent SQL injection
      if (!key || !value) {
        const errorMsg = 'Key and value must not be empty';
        console.error(`[TABLELAND ERROR] ${errorMsg}`, { key, value });
        debugLog(`Validation error: ${errorMsg}`, { key, value });
        throw new Error(errorMsg);
      }
      
      // Validate table name
      if (!tableName) {
        const errorMsg = 'Table name must not be empty';
        console.error(`[TABLELAND ERROR] ${errorMsg}`);
        debugLog(`Validation error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Sanitize inputs using our utility function
      const sanitizedKey = sanitizeInput(key);
      const sanitizedValue = sanitizeInput(value);
      const timestamp = new Date().toISOString();
      
      // Use the table name as is - it's already properly formatted from createTable
      // Just log it for debugging purposes
      console.log(`[TABLELAND] Using table name: ${tableName}`);
      
      // Construct the SQL query
      const sqlQuery = `
        INSERT INTO ${tableName} (item_key, item_value, created_at)
        VALUES ('${sanitizedKey}', '${sanitizedValue}', '${timestamp}')
      `;
      console.log(`[TABLELAND] SQL Query: ${sqlQuery}`);
      
      // Insert data into the Tableland table with the new format (with chain ID 10)
      debugLog(`Inserting into table ${tableName}`);
      console.log(`[TABLELAND] Preparing to execute insert query`);
      
      // Execute the query
      const result = await db.prepare(sqlQuery).run();
      console.log(`[TABLELAND] Insert query executed`, result);
      
      // Check if meta exists
      if (!result || !result.meta) {
        console.error(`[TABLELAND ERROR] Insert result missing meta property`, result);
        debugLog(`Insert result missing meta property`, result);
      }
      
      // Wait for transaction to complete
      if (result?.meta?.txn) {
        console.log(`[TABLELAND] Waiting for transaction to complete`, { 
          txDetails: JSON.stringify(result.meta.txn).substring(0, 100) + '...'
        });
        await result.meta.txn.wait();
        console.log(`[TABLELAND] Transaction completed successfully`);
      } else {
        console.log(`[TABLELAND] No transaction to wait for, insert may have been completed immediately`);
      }
      
      debugLog(`Successfully inserted data into table ${tableName}`);
      console.log(`[TABLELAND] Successfully inserted data into table ${tableName}`);
    } catch (error) {
      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is the mock provider error
      if (errorMessage.includes('eth_blockNumber not implemented in mock provider')) {
        // We're in a development environment with a mock provider
        console.log(`[TABLELAND] Mock provider detected, simulating successful insert for testing`);
        debugLog(`Mock provider detected, simulating successful insert for testing`);
        console.log(`[TABLELAND] In production, this would insert: Key=${key}, Value=${value}`);
        
        // Return without throwing an error to simulate success
        return;
      }
      
      // For other errors, log and rethrow
      console.error(`[TABLELAND ERROR] Failed to insert data into ${tableType} table ${tableName}:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        tableType,
        tableName,
        keyLength: key?.length,
        valueLength: value?.length
      });
      debugLog(`Error inserting data into ${tableType} table ${tableName}: ${errorMessage}`, error);
      
      // Re-throw the error to be handled by executeWithRetry
      throw error;
    }
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
    // Use the table name as is - it's already properly formatted from createTable
    // Just log it for debugging purposes
    debugLog(`Executing query on table ${tableName}`);
    const queryResult = await db.prepare(`
      SELECT id, item_key, item_value, created_at FROM ${tableName} ORDER BY id ASC
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
  console.log(`[TABLELAND] Checking if table exists for ${tableType} with address ${address}`);
  
  // Skip if we're on the server side
  if (typeof window === 'undefined') {
    debugLog(`Server-side rendering detected, skipping table check for ${tableType}`);
    console.log('[TABLELAND] Server-side rendering detected, skipping table check');
    // Return a default response for server-side rendering
    return { exists: false, tableName: `${tableType}_placeholder` };
  }
  
  // Validate inputs
  if (!db) {
    const errorMsg = `Database instance is null or undefined for ${tableType} table check`;
    debugLog(errorMsg);
    console.error(`[TABLELAND ERROR] ${errorMsg}`);
    return { exists: false, tableName: `${tableType}_error` };
  }
  
  if (!address) {
    const errorMsg = `Address is null or undefined for ${tableType} table check`;
    debugLog(errorMsg);
    console.error(`[TABLELAND ERROR] ${errorMsg}`);
    return { exists: false, tableName: `${tableType}_error` };
  }
  
  console.log(`[TABLELAND] Starting table existence check for ${tableType} with address ${address}`, {
    dbType: typeof db,
    hasProperties: db ? Object.keys(db) : 'none',
    address
  });
  
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
    
    console.log(`[TABLELAND] Processing address: ${address}, cleaned to: ${cleanAddress}, prefix: ${prefix}`);
    
    // Ensure tableName follows Tableland naming conventions
    // Tableland requires lowercase names with format tablename_chainid_uniqueid
    const safeTableType = tableType.toString().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Use Optimism (Chain ID 10) for all Tableland operations
    // This is our strategic decision to benefit from lower gas costs
    const chainId = 10; // Optimism
    
    // Format: tablename_chainid_addressprefix
    const tableName = `${safeTableType}_${chainId}_${prefix}`.toLowerCase();
    
    console.log(`[TABLELAND] Constructed table name for check: ${tableName}`);
    debugLog(`Constructed table name for check: ${tableName} for type ${tableType} and address ${address}`);
    
    try {
      // Check if the table exists by trying to query it
      // This will throw an error if the table doesn't exist
      debugLog(`Preparing to query table ${tableName} to check existence`);
      const sqlQuery = `SELECT * FROM ${tableName} LIMIT 1`;
      console.log(`[TABLELAND] SQL query for table check: ${sqlQuery}`);
      debugLog(`SQL query for table check: ${sqlQuery}`);
      
      const result = await db.prepare(sqlQuery).all();
      const hasResults = result?.results?.length > 0;
      
      console.log(`[TABLELAND] Table ${tableName} exists, query returned results: ${hasResults}`, result);
      debugLog(`Table ${tableName} exists, query returned results: ${hasResults}`, result);
      
      // If we get here, the table exists
      return { exists: true, tableName };
    } catch (queryError) {
      // Extract error message
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      
      // Log detailed error information
      console.error(`[TABLELAND ERROR] Error checking if table ${tableName} exists:`, {
        error: errorMessage,
        stack: queryError instanceof Error ? queryError.stack : 'No stack trace'
      });
      debugLog(`Error checking if table ${tableName} exists: ${errorMessage}`, queryError);
      
      // Check if the error is specifically about the table not existing
      const isTableNotFoundError = 
        errorMessage.includes('does not exist') || 
        errorMessage.includes('no such table') ||
        errorMessage.includes('not found');
      
      if (isTableNotFoundError) {
        console.log(`[TABLELAND] Table ${tableName} confirmed not to exist (expected error)`);
        debugLog(`Table ${tableName} confirmed not to exist (expected error)`);
      } else {
        console.error(`[TABLELAND ERROR] Unexpected error during table check for ${tableName}: ${errorMessage}`);
        debugLog(`Unexpected error during table check for ${tableName}: ${errorMessage}`);
      }
      
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
