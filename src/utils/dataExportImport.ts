/**
 * Data export and import utilities for Ceramic data
 * This provides functionality to export and import data for backup and migration
 */

import { ContentRecord, DataType, clearCollection, createRecord } from './ceramicUtils';
import { monitorAsync } from './performanceMonitor';

// Interface for exported data
export interface ExportedData {
  version: string;
  exportDate: string;
  collections: {
    [collectionId: string]: ContentRecord[];
  };
}

/**
 * Export all data from localStorage
 * @returns Exported data as a JSON string
 */
export const exportAllData = async (): Promise<string> => {
  return monitorAsync('exportAllData', 'dataExportImport', async () => {
    try {
      const storageStr = localStorage.getItem('ceramic_local_storage');
      const storage = storageStr ? JSON.parse(storageStr) : {};
      
      const exportData: ExportedData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        collections: storage
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  });
};

/**
 * Export data for a specific collection
 * @param collectionId The ID of the collection to export
 * @returns Exported data as a JSON string
 */
export const exportCollectionData = async (collectionId: string): Promise<string> => {
  return monitorAsync('exportCollectionData', 'dataExportImport', async () => {
    try {
      const storageStr = localStorage.getItem('ceramic_local_storage');
      const storage = storageStr ? JSON.parse(storageStr) : {};
      
      if (!storage[collectionId]) {
        throw new Error(`Collection ${collectionId} not found`);
      }
      
      const exportData: ExportedData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        collections: {
          [collectionId]: storage[collectionId]
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`Error exporting collection ${collectionId}:`, error);
      throw new Error(`Failed to export collection ${collectionId}`);
    }
  });
};

/**
 * Import data from a JSON string
 * @param jsonData The JSON data to import
 * @param overwrite Whether to overwrite existing collections
 * @returns Whether the import was successful
 */
export const importData = async (jsonData: string, overwrite: boolean = false): Promise<boolean> => {
  return monitorAsync('importData', 'dataExportImport', async () => {
    try {
      const importData = JSON.parse(jsonData) as ExportedData;
      
      // Validate the imported data
      if (!importData.version || !importData.exportDate || !importData.collections) {
        throw new Error('Invalid import data format');
      }
      
      const storageStr = localStorage.getItem('ceramic_local_storage');
      const storage = storageStr ? JSON.parse(storageStr) : {};
      
      // Import each collection
      Object.entries(importData.collections).forEach(([collectionId, records]) => {
        if (storage[collectionId] && !overwrite) {
          console.warn(`Collection ${collectionId} already exists, skipping import`);
          return;
        }
        
        storage[collectionId] = records;
      });
      
      // Save the updated storage
      localStorage.setItem('ceramic_local_storage', JSON.stringify(storage));
      
      console.log('Data import successful');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  });
};

/**
 * Import data for a specific data type
 * @param ceramic The Ceramic client
 * @param dataType The type of data to import
 * @param did The DID of the user
 * @param jsonData The JSON data to import
 * @param overwrite Whether to overwrite existing data
 * @returns Whether the import was successful
 */
export const importDataType = async (
  ceramic: any,
  dataType: DataType,
  did: string,
  jsonData: string,
  overwrite: boolean = false
): Promise<boolean> => {
  return monitorAsync('importDataType', 'dataExportImport', async () => {
    try {
      const importData = JSON.parse(jsonData) as ExportedData;
      
      // Validate the imported data
      if (!importData.version || !importData.exportDate || !importData.collections) {
        throw new Error('Invalid import data format');
      }
      
      const collectionId = `${dataType}_${did}`;
      
      // Check if the collection exists in the imported data
      if (!importData.collections[collectionId]) {
        console.warn(`Collection ${collectionId} not found in import data`);
        return false;
      }
      
      // Clear the existing collection if overwrite is true
      if (overwrite) {
        await clearCollection(ceramic, collectionId);
      }
      
      // Import each record
      const records = importData.collections[collectionId];
      for (const record of records) {
        await createRecord(ceramic, dataType, collectionId, record.content, record.tags);
      }
      
      console.log(`Data import for ${dataType} successful`);
      return true;
    } catch (error) {
      console.error(`Error importing data for ${dataType}:`, error);
      return false;
    }
  });
};

/**
 * Download exported data as a file
 * @param data The data to download
 * @param filename The name of the file
 */
export const downloadExportedData = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Create a backup of all data
 * @param prefix Optional prefix for the filename
 */
export const createBackup = async (prefix: string = 'wot-id'): Promise<void> => {
  const data = await exportAllData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-backup-${timestamp}.json`;
  downloadExportedData(data, filename);
};
