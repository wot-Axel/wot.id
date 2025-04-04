/**
 * Ceramic utility functions for interacting with the Ceramic network
 * This is a minimal placeholder version without external dependencies
 */

import { monitorAsync } from './performanceMonitor.js';
import { validateData } from './schemaValidation.js';

// Enum for data types to ensure consistency across the application
export const DataType = {
  PROFILE: 'profile',
  DOCUMENTS: 'documents',
  MEDICAL: 'medical',
  DIGITAL_ASSETS: 'digital_assets',
  REAL_WORLD_ASSETS: 'real_world_assets',
  CONNECTIONS: 'connections',
  MESSAGES: 'messages',
  PRIVATE: 'private'
};

// Interface for content record
export class ContentRecord {
  constructor(id, streamId, controller, createdAt, updatedAt, content, tags) {
    this.id = id;
    this.streamId = streamId;
    this.controller = controller;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.content = content;
    this.tags = tags;
  }
}

// Storage key for localStorage
const CERAMIC_STORAGE_KEY = 'ceramic_local_storage';

/**
 * Get the storage from localStorage
 * @returns The storage object
 */
const getStorage = () => {
  try {
    const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
    return storageStr ? JSON.parse(storageStr) : {};
  } catch (error) {
    console.error('Error getting storage:', error);
    return {};
  }
};

/**
 * Save the storage to localStorage
 * @param storage The storage object to save
 */
const saveStorage = (storage) => {
  try {
    localStorage.setItem(CERAMIC_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Error saving storage:', error);
  }
};

/**
 * Clear all collections from storage
 */
export const clearAllCollections = () => {
  try {
    localStorage.removeItem(CERAMIC_STORAGE_KEY);
    console.log('All collections cleared');
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
};

/**
 * Check if a collection exists for a specific data type and DID
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const checkCollectionExists = async (ceramic, dataType, did) => {
  return monitorAsync('checkCollectionExists', 'ceramicUtils', async () => {
    const collectionId = `${dataType}_${did}`;
    const storage = getStorage();
    const exists = !!storage[collectionId];
    
    return { exists, collectionId };
  });
};

/**
 * Create a new collection for a specific data type and DID
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param did The DID of the user
 * @returns Collection information
 */
export const createCollection = async (ceramic, dataType, did) => {
  return monitorAsync('createCollection', 'ceramicUtils', async () => {
    const collectionId = `${dataType}_${did}`;
    const storage = getStorage();
    
    // Initialize the collection if it doesn't exist
    if (!storage[collectionId]) {
      storage[collectionId] = [];
      saveStorage(storage);
    }
    
    return { exists: true, collectionId };
  });
};

/**
 * Create a new record in a collection
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param content The content of the record
 * @param tags Optional tags for the record
 * @returns The created record
 */
export const createRecord = async (ceramic, dataType, collectionId, content, tags = []) => {
  return monitorAsync('createRecord', 'ceramicUtils', async () => {
    // Validate the data before storing it
    const validationResult = await validateData(dataType, content);
    if (!validationResult.valid) {
      console.warn(`Data validation failed for ${collectionId}:`, validationResult.errors);
      // Continue anyway for now, but log the validation errors
      // In the future, this could throw an error to prevent invalid data from being stored
    }
    
    // Get the storage
    const storage = getStorage();
    
    // Initialize the collection if it doesn't exist
    if (!storage[collectionId]) {
      storage[collectionId] = [];
    }
    
    const timestamp = new Date().toISOString();
    const did = ceramic.did?.id || 'unknown';
    
    // Create a new record
    const record = new ContentRecord(
      Math.random().toString(36).substring(2, 15),
      Math.random().toString(36).substring(2, 15),
      did,
      timestamp,
      timestamp,
      content,
      tags
    );
    
    // Add the record to the collection
    storage[collectionId].push(record);
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Created record in ${collectionId}:`, record);
    return record;
  });
};

/**
 * Get all records from a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection
 * @returns Array of records
 */
export const getRecords = async (ceramic, collectionId) => {
  return monitorAsync('getRecords', 'ceramicUtils', async () => {
    const storage = getStorage();
    return storage[collectionId] || [];
  });
};

/**
 * Update a record in a collection
 * @param ceramic The Ceramic client
 * @param dataType The type of data
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to update
 * @param content The new content of the record
 * @param tags Optional new tags for the record
 * @returns The updated record or null if not found
 */
export const updateRecord = async (ceramic, dataType, collectionId, recordId, content, tags) => {
  return monitorAsync('updateRecord', 'ceramicUtils', async () => {
    // Validate the data before updating
    const validationResult = await validateData(dataType, content);
    if (!validationResult.valid) {
      console.warn(`Data validation failed for ${collectionId}:`, validationResult.errors);
      // Continue anyway for now, but log the validation errors
    }
    
    const storage = getStorage();
    if (!storage[collectionId]) {
      return null;
    }
    
    const recordIndex = storage[collectionId].findIndex(record => record.id === recordId);
    if (recordIndex === -1) {
      return null;
    }
    
    const timestamp = new Date().toISOString();
    const record = storage[collectionId][recordIndex];
    
    // Update the record
    const updatedRecord = new ContentRecord(
      record.id,
      record.streamId,
      record.controller,
      record.createdAt,
      timestamp,
      content,
      tags || record.tags
    );
    
    // Replace the record in the collection
    storage[collectionId][recordIndex] = updatedRecord;
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Updated record in ${collectionId}:`, updatedRecord);
    return updatedRecord;
  });
};

/**
 * Delete a record from a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection
 * @param recordId The ID of the record to delete
 * @returns Whether the record was deleted
 */
export const deleteRecord = async (ceramic, collectionId, recordId) => {
  return monitorAsync('deleteRecord', 'ceramicUtils', async () => {
    const storage = getStorage();
    if (!storage[collectionId]) {
      return false;
    }
    
    const recordIndex = storage[collectionId].findIndex(record => record.id === recordId);
    if (recordIndex === -1) {
      return false;
    }
    
    // Remove the record from the collection
    storage[collectionId].splice(recordIndex, 1);
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Deleted record ${recordId} from ${collectionId}`);
    return true;
  });
};

/**
 * Clear a collection
 * @param ceramic The Ceramic client
 * @param collectionId The ID of the collection to clear
 * @returns Whether the collection was cleared
 */
export const clearCollection = async (ceramic, collectionId) => {
  return monitorAsync('clearCollection', 'ceramicUtils', async () => {
    const storage = getStorage();
    if (!storage[collectionId]) {
      return false;
    }
    
    // Clear the collection
    storage[collectionId] = [];
    
    // Save the updated storage
    saveStorage(storage);
    
    console.log(`Cleared collection ${collectionId}`);
    return true;
  });
};
