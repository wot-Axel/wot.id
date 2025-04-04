/**
 * Data export and import utilities for Ceramic data
 * This provides functionality for exporting and importing data
 */

import { monitorAsync } from './performanceMonitor.js';
import { encryptData, decryptData, isEncrypted } from './encryptionUtils.js';

// Storage key for localStorage
const CERAMIC_STORAGE_KEY = 'ceramic_local_storage';

/**
 * Export all data from localStorage
 * @param password Optional password to encrypt the data
 * @returns The exported data as a string
 */
export const exportAllData = async (password = null) => {
  return monitorAsync('exportAllData', 'dataExportImport', async () => {
    const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
    const data = storageStr ? JSON.parse(storageStr) : {};
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(data);
    
    // Encrypt if password is provided
    if (password) {
      return encryptData(data, password);
    }
    
    return jsonStr;
  });
};

/**
 * Export a specific collection from localStorage
 * @param collectionId The ID of the collection to export
 * @param password Optional password to encrypt the data
 * @returns The exported collection data as a string
 */
export const exportCollection = async (collectionId, password = null) => {
  return monitorAsync('exportCollection', 'dataExportImport', async () => {
    const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
    const storage = storageStr ? JSON.parse(storageStr) : {};
    
    // Get the collection data
    const data = storage[collectionId] || [];
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(data);
    
    // Encrypt if password is provided
    if (password) {
      return encryptData(data, password);
    }
    
    return jsonStr;
  });
};

/**
 * Import data into localStorage
 * @param data The data to import
 * @param overwrite Whether to overwrite existing data
 * @param password Optional password to decrypt the data
 * @returns Whether the import was successful
 */
export const importData = async (data, overwrite = false, password = null) => {
  return monitorAsync('importData', 'dataExportImport', async () => {
    try {
      // Check if data is encrypted
      let parsedData;
      if (isEncrypted(data) && password) {
        // Decrypt the data
        parsedData = await decryptData(data, password);
      } else if (isEncrypted(data) && !password) {
        throw new Error('Data is encrypted but no password was provided');
      } else {
        // Parse the data
        parsedData = JSON.parse(data);
      }
      
      // Get existing data
      const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
      const storage = storageStr ? JSON.parse(storageStr) : {};
      
      // Merge data
      const mergedData = overwrite ? parsedData : { ...storage, ...parsedData };
      
      // Save to localStorage
      localStorage.setItem(CERAMIC_STORAGE_KEY, JSON.stringify(mergedData));
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  });
};

/**
 * Import a collection into localStorage
 * @param collectionId The ID of the collection to import
 * @param data The collection data to import
 * @param overwrite Whether to overwrite existing data
 * @param password Optional password to decrypt the data
 * @returns Whether the import was successful
 */
export const importCollection = async (collectionId, data, overwrite = false, password = null) => {
  return monitorAsync('importCollection', 'dataExportImport', async () => {
    try {
      // Check if data is encrypted
      let parsedData;
      if (isEncrypted(data) && password) {
        // Decrypt the data
        parsedData = await decryptData(data, password);
      } else if (isEncrypted(data) && !password) {
        throw new Error('Data is encrypted but no password was provided');
      } else {
        // Parse the data
        parsedData = JSON.parse(data);
      }
      
      // Get existing data
      const storageStr = localStorage.getItem(CERAMIC_STORAGE_KEY);
      const storage = storageStr ? JSON.parse(storageStr) : {};
      
      // Update the collection
      storage[collectionId] = overwrite ? parsedData : [...(storage[collectionId] || []), ...parsedData];
      
      // Save to localStorage
      localStorage.setItem(CERAMIC_STORAGE_KEY, JSON.stringify(storage));
      
      return true;
    } catch (error) {
      console.error('Error importing collection:', error);
      return false;
    }
  });
};

/**
 * Create a backup file and trigger download
 * @param data The data to backup
 * @param filename The name of the backup file
 */
export const createBackupFile = (data, filename = 'wot-id-backup.json') => {
  // Create a blob from the data
  const blob = new Blob([data], { type: 'application/json' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Click the link to trigger download
  link.click();
  
  // Remove the link from the document
  document.body.removeChild(link);
  
  // Revoke the URL
  URL.revokeObjectURL(url);
};
