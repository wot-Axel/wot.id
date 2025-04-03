import { Database } from '@tableland/sdk';
import { optimism } from '@reown/appkit/networks';
import { getWalletClient } from '@wagmi/core';

// Interface for table data
export interface TableData {
  id: number;
  key: string;
  value: string;
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

// Mock database for development
const mockDatabases: Record<string, TableData[]> = {
  [TableType.PRIVATE]: [],
  [TableType.MEDICAL]: [],
  [TableType.ACCOUNTS]: [],
  [TableType.CONTACTS]: [],
  [TableType.AFFILIATIONS]: [],
  [TableType.CURRENCIES]: [],
  [TableType.DIGITAL_ASSETS]: [],
  [TableType.CHAT]: []
};

// Track created tables
const mockTablesCreated: Record<string, boolean> = {
  [TableType.PRIVATE]: false,
  [TableType.MEDICAL]: false,
  [TableType.ACCOUNTS]: false,
  [TableType.CONTACTS]: false,
  [TableType.AFFILIATIONS]: false,
  [TableType.CURRENCIES]: false,
  [TableType.DIGITAL_ASSETS]: false,
  [TableType.CHAT]: false
};

// Initialize Tableland database with Optimism chain
export const initTableland = async (): Promise<Database> => {
  try {
    // In a real implementation, we would connect to Tableland here
    // For now, we'll return a mock database interface
    return {} as Database;
  } catch (error) {
    console.error('Error initializing Tableland:', error);
    throw error;
  }
};

// Generic function to create a table
export const createTable = async (db: Database, tableType: TableType, address: string): Promise<string> => {
  try {
    // In a real implementation, we would create a table in Tableland
    // For now, we'll just mark the table as created in our mock database
    mockTablesCreated[tableType] = true;
    
    // Return a mock table name
    return `${tableType}_${address.slice(0, 8)}_31337_1`;
  } catch (error) {
    console.error(`Error creating ${tableType} table:`, error);
    throw error;
  }
};

// Generic function to insert data into a table
export const insertData = async (
  db: Database, 
  tableType: TableType, 
  tableName: string, 
  key: string, 
  value: string
): Promise<void> => {
  try {
    // In a real implementation, we would insert data into Tableland
    // For now, we'll just add it to our mock database
    const newItem: TableData = {
      id: mockDatabases[tableType].length + 1,
      key,
      value,
      created_at: new Date().toISOString()
    };
    
    mockDatabases[tableType].push(newItem);
  } catch (error) {
    console.error(`Error inserting data into ${tableType} table:`, error);
    throw error;
  }
};

// Generic function to get data from a table
export const getData = async (db: Database, tableType: TableType, tableName: string): Promise<TableData[]> => {
  try {
    // In a real implementation, we would query Tableland
    // For now, we'll just return our mock database
    return mockDatabases[tableType];
  } catch (error) {
    console.error(`Error getting data from ${tableType} table:`, error);
    throw error;
  }
};

// Generic function to check if a table exists
export const checkTableExists = async (db: Database, tableType: TableType, address: string): Promise<boolean> => {
  try {
    // In a real implementation, we would query Tableland to check if the table exists
    // For now, we'll just check our mock database
    return mockTablesCreated[tableType];
  } catch (error) {
    console.error(`Error checking if ${tableType} table exists:`, error);
    throw error;
  }
};

// Generic function to clear data from a table
export const clearData = async (db: Database, tableType: TableType, tableName: string): Promise<void> => {
  try {
    // In a real implementation, we would delete data from Tableland
    // For now, we'll just clear our mock database
    mockDatabases[tableType] = [];
  } catch (error) {
    console.error(`Error clearing data from ${tableType} table:`, error);
    throw error;
  }
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
  const exists = await checkTableExists(db, TableType.PRIVATE, address);
  return {
    exists,
    tableName: exists ? `${TableType.PRIVATE}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.MEDICAL, address);
  return {
    exists,
    tableName: exists ? `${TableType.MEDICAL}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.ACCOUNTS, address);
  return {
    exists,
    tableName: exists ? `${TableType.ACCOUNTS}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.CONTACTS, address);
  return {
    exists,
    tableName: exists ? `${TableType.CONTACTS}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.AFFILIATIONS, address);
  return {
    exists,
    tableName: exists ? `${TableType.AFFILIATIONS}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.CURRENCIES, address);
  return {
    exists,
    tableName: exists ? `${TableType.CURRENCIES}_${address.slice(0, 8)}_31337_1` : ''
  };
};

export const clearCurrenciesData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.CURRENCIES, tableName);
};

// Digital Assets table functions
export const createDigitalAssetsTable = async (db: Database, address: string): Promise<{tableName: string}> => {
  const tableName = await createTable(db, TableType.DIGITAL_ASSETS, address);
  return { tableName };
};

export const insertDigitalAssetData = async (db: Database, tableName: string, value: string): Promise<void> => {
  // Digital assets use a different signature, so we use an empty key
  return insertData(db, TableType.DIGITAL_ASSETS, tableName, '', value);
};

export const getDigitalAssetsData = async (db: Database, tableName: string): Promise<TableData[]> => {
  return getData(db, TableType.DIGITAL_ASSETS, tableName);
};

export const checkDigitalAssetsTableExists = async (db: Database, address: string): Promise<{exists: boolean, tableName: string}> => {
  const exists = await checkTableExists(db, TableType.DIGITAL_ASSETS, address);
  return {
    exists,
    tableName: exists ? `${TableType.DIGITAL_ASSETS}_${address.slice(0, 8)}_31337_1` : ''
  };
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
  const exists = await checkTableExists(db, TableType.CHAT, address);
  return {
    exists,
    tableName: exists ? `${TableType.CHAT}_${address.slice(0, 8)}_31337_1` : ''
  };
};

export const clearChatData = async (db: Database, tableName: string): Promise<void> => {
  return clearData(db, TableType.CHAT, tableName);
};
