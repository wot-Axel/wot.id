import { Database } from '@tableland/sdk';
import { optimism } from '@reown/appkit/networks';
import { getWalletClient } from '@wagmi/core';

// Interface for private data
export interface PrivateData {
  id: number;
  key: string;
  value: string;
  created_at: string;
}

// Mock databases for development
let mockPrivateDatabase: PrivateData[] = [];
let mockMedicalDatabase: PrivateData[] = [];
let mockAccountsDatabase: PrivateData[] = [];
let mockContactsDatabase: PrivateData[] = [];
let mockPrivateTableCreated = false;
let mockMedicalTableCreated = false;
let mockAccountsTableCreated = false;
let mockContactsTableCreated = false;

// Initialize Tableland database with Optimism chain
export const initTableland = async () => {
  try {
    // In a real implementation, we would connect to Tableland here
    // For now, we'll return a mock database interface
    return {} as Database;
  } catch (error) {
    console.error('Error initializing Tableland:', error);
    throw error;
  }
};

// Create a new private table for the user
export const createPrivateTable = async (db: Database, address: string) => {
  try {
    // For development, we'll simulate creating a table
    mockPrivateTableCreated = true;
    const tableName = `wot_private_${address.substring(2, 10).toLowerCase()}`;
    return tableName;
  } catch (error) {
    console.error('Error creating private table:', error);
    throw error;
  }
};

// Create a new medical data table for the user
export const createMedicalTable = async (db: Database, address: string) => {
  try {
    // For development, we'll simulate creating a table
    mockMedicalTableCreated = true;
    const tableName = `wot_medical_${address.substring(2, 10).toLowerCase()}`;
    return tableName;
  } catch (error) {
    console.error('Error creating medical table:', error);
    throw error;
  }
};

// Insert data into private table
export const insertPrivateData = async (db: Database, tableName: string, key: string, value: string) => {
  try {
    // For development, we'll add to our mock database
    const timestamp = new Date().toISOString();
    const newId = mockPrivateDatabase.length > 0 ? Math.max(...mockPrivateDatabase.map(item => item.id)) + 1 : 1;
    
    const newItem: PrivateData = {
      id: newId,
      key,
      value,
      created_at: timestamp
    };
    
    mockPrivateDatabase.unshift(newItem); // Add to beginning for reverse chronological order
    return true;
  } catch (error) {
    console.error('Error inserting private data:', error);
    throw error;
  }
};

// Insert data into medical table
export const insertMedicalData = async (db: Database, tableName: string, key: string, value: string) => {
  try {
    // For development, we'll add to our mock medical database
    const timestamp = new Date().toISOString();
    const newId = mockMedicalDatabase.length > 0 ? Math.max(...mockMedicalDatabase.map(item => item.id)) + 1 : 1;
    
    const newItem: PrivateData = {
      id: newId,
      key,
      value,
      created_at: timestamp
    };
    
    mockMedicalDatabase.unshift(newItem); // Add to beginning for reverse chronological order
    return true;
  } catch (error) {
    console.error('Error inserting medical data:', error);
    throw error;
  }
};

// Get all private data for a user
export const getPrivateData = async (db: Database, tableName: string) => {
  try {
    // For development, return our mock private database
    return mockPrivateDatabase;
  } catch (error) {
    console.error('Error getting private data:', error);
    return [];
  }
};

// Get all medical data for a user
export const getMedicalData = async (db: Database, tableName: string) => {
  try {
    // For development, return our mock medical database
    return mockMedicalDatabase;
  } catch (error) {
    console.error('Error getting medical data:', error);
    return [];
  }
};

// Check if a private table exists for a user
export const checkTableExists = async (db: Database, address: string) => {
  try {
    // For development, check our mock flag
    if (mockPrivateTableCreated) {
      return `wot_private_${address.substring(2, 10).toLowerCase()}`;
    }
    return '';
  } catch (error) {
    // Table doesn't exist
    return '';
  }
};

// Check if a medical table exists for a user
export const checkMedicalTableExists = async (db: Database, address: string) => {
  try {
    // For development, check our mock flag
    if (mockMedicalTableCreated) {
      return `wot_medical_${address.substring(2, 10).toLowerCase()}`;
    }
    return '';
  } catch (error) {
    // Table doesn't exist
    return '';
  }
};

// Clear all private data
export const clearPrivateData = async (db: Database, tableName: string) => {
  try {
    // For development, clear our mock private database
    mockPrivateDatabase = [];
    return true;
  } catch (error) {
    console.error('Error clearing private data:', error);
    throw error;
  }
};

// Create a new accounts table for the user
export const createAccountsTable = async (db: Database, address: string) => {
  try {
    // For development, we'll simulate creating a table
    mockAccountsTableCreated = true;
    const tableName = `wot_accounts_${address.substring(2, 10).toLowerCase()}`;
    return tableName;
  } catch (error) {
    console.error('Error creating accounts table:', error);
    throw error;
  }
};

// Insert data into accounts table
export const insertAccountData = async (db: Database, tableName: string, key: string, value: string) => {
  try {
    // For development, we'll add to our mock accounts database
    const timestamp = new Date().toISOString();
    const newId = mockAccountsDatabase.length > 0 ? Math.max(...mockAccountsDatabase.map(item => item.id)) + 1 : 1;
    
    const newItem: PrivateData = {
      id: newId,
      key,
      value,
      created_at: timestamp
    };
    
    mockAccountsDatabase.unshift(newItem); // Add to beginning for reverse chronological order
    return true;
  } catch (error) {
    console.error('Error inserting account data:', error);
    throw error;
  }
};

// Get all accounts data for a user
export const getAccountsData = async (db: Database, tableName: string) => {
  try {
    // For development, return our mock accounts database
    return mockAccountsDatabase;
  } catch (error) {
    console.error('Error getting accounts data:', error);
    return [];
  }
};

// Check if an accounts table exists for a user
export const checkAccountsTableExists = async (db: Database, address: string) => {
  try {
    // For development, check our mock flag
    if (mockAccountsTableCreated) {
      return `wot_accounts_${address.substring(2, 10).toLowerCase()}`;
    }
    return '';
  } catch (error) {
    // Table doesn't exist
    return '';
  }
};

// Clear all accounts data
export const clearAccountsData = async (db: Database, tableName: string) => {
  try {
    // For development, clear our mock accounts database
    mockAccountsDatabase = [];
    return true;
  } catch (error) {
    console.error('Error clearing accounts data:', error);
    throw error;
  }
};

// Create a new contacts table for the user
export const createContactsTable = async (db: Database, address: string) => {
  try {
    // For development, we'll simulate creating a table
    mockContactsTableCreated = true;
    const tableName = `wot_contacts_${address.substring(2, 10).toLowerCase()}`;
    return tableName;
  } catch (error) {
    console.error('Error creating contacts table:', error);
    throw error;
  }
};

// Insert data into contacts table
export const insertContactData = async (db: Database, tableName: string, key: string, value: string) => {
  try {
    // For development, we'll add to our mock contacts database
    const timestamp = new Date().toISOString();
    const newId = mockContactsDatabase.length > 0 ? Math.max(...mockContactsDatabase.map(item => item.id)) + 1 : 1;
    
    const newItem: PrivateData = {
      id: newId,
      key,
      value,
      created_at: timestamp
    };
    
    mockContactsDatabase.unshift(newItem); // Add to beginning for reverse chronological order
    return true;
  } catch (error) {
    console.error('Error inserting contact data:', error);
    throw error;
  }
};

// Get all contacts data for a user
export const getContactsData = async (db: Database, tableName: string) => {
  try {
    // For development, return our mock contacts database
    return mockContactsDatabase;
  } catch (error) {
    console.error('Error getting contacts data:', error);
    return [];
  }
};

// Check if a contacts table exists for a user
export const checkContactsTableExists = async (db: Database, address: string) => {
  try {
    // For development, check our mock flag
    if (mockContactsTableCreated) {
      return `wot_contacts_${address.substring(2, 10).toLowerCase()}`;
    }
    return '';
  } catch (error) {
    // Table doesn't exist
    return '';
  }
};

// Clear all contacts data
export const clearContactsData = async (db: Database, tableName: string) => {
  try {
    // For development, clear our mock contacts database
    mockContactsDatabase = [];
    return true;
  } catch (error) {
    console.error('Error clearing contacts data:', error);
    throw error;
  }
};
