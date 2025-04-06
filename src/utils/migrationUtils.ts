/**
 * Migration Utilities
 * 
 * This file provides utility functions for migrating data from Ceramic to Tableland
 * and ensuring a smooth transition between the two database systems.
 */

import { DataType } from '../composedb/ceramic-utils';
import { TableType } from './tablelandUtils';
import { useComposeDB } from '../context/ComposeDBContext';
import { useTableland } from '../context/TablelandContext';

// Map Ceramic DataType to Tableland TableType
export const mapDataTypeToTableType = (dataType: DataType): TableType => {
  switch (dataType) {
    case DataType.PROFILE:
      return TableType.PRIVATE; // Map profile to private table
    case DataType.DOCUMENTS:
      return TableType.PRIVATE; // Map documents to private table
    case DataType.DIGITAL_ASSETS:
      return TableType.DIGITAL_ASSETS;
    case DataType.REAL_WORLD_ASSETS:
      return TableType.PRIVATE; // Map real world assets to private table
    case DataType.MEDICAL:
      return TableType.MEDICAL;
    case DataType.CONNECTIONS:
      return TableType.CONTACTS;
    case DataType.ORGANIZATIONS:
      return TableType.AFFILIATIONS;
    case DataType.MESSAGES:
      return TableType.CHAT;
    case DataType.PRIVATE:
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};

// Convert Ceramic model to Tableland format
export const convertCeramicToTableland = (ceramicModel: any): { key: string, value: string } => {
  // Extract key from content if possible, otherwise use a default key
  const key = ceramicModel.content?.name || 
              ceramicModel.content?.title || 
              ceramicModel.content?.id || 
              'data_' + Date.now();
  
  // Stringify the entire content object for the value
  const value = JSON.stringify(ceramicModel.content);
  
  return { key, value };
};

// Hook to migrate data from Ceramic to Tableland
export const useMigration = () => {
  const ceramic = useComposeDB();
  const tableland = useTableland();
  
  // Migrate all data from one Ceramic data type to Tableland
  const migrateDataType = async (dataType: DataType): Promise<boolean> => {
    try {
      if (!ceramic.isInitialized || !tableland.isInitialized) {
        console.error('Both Ceramic and Tableland must be initialized for migration');
        return false;
      }
      
      console.log(`Starting migration for ${dataType}...`);
      
      // Get all models from Ceramic
      const ceramicModels = await ceramic.getModels(dataType);
      
      if (ceramicModels.length === 0) {
        console.log(`No data found for ${dataType}, skipping migration`);
        return true;
      }
      
      console.log(`Found ${ceramicModels.length} records to migrate for ${dataType}`);
      
      // Map to Tableland table type
      const tableType = mapDataTypeToTableType(dataType);
      
      // Migrate each model
      for (const model of ceramicModels) {
        const { key, value } = convertCeramicToTableland(model);
        
        // Create in Tableland
        await tableland.createModel(tableType, key, value);
      }
      
      console.log(`Successfully migrated ${ceramicModels.length} records for ${dataType}`);
      return true;
    } catch (error) {
      console.error(`Error migrating ${dataType}:`, error);
      return false;
    }
  };
  
  // Migrate all data types
  const migrateAllData = async (): Promise<{
    success: boolean;
    results: Record<DataType, boolean>;
  }> => {
    const results: Record<DataType, boolean> = {} as Record<DataType, boolean>;
    let allSuccessful = true;
    
    // Migrate each data type
    for (const dataType of Object.values(DataType)) {
      const success = await migrateDataType(dataType as DataType);
      results[dataType as DataType] = success;
      
      if (!success) {
        allSuccessful = false;
      }
    }
    
    return {
      success: allSuccessful,
      results
    };
  };
  
  return {
    migrateDataType,
    migrateAllData
  };
};

// Function to check if localStorage has Ceramic data
export const hasCeramicData = (): boolean => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  // Check for Ceramic storage key
  const ceramicStorage = localStorage.getItem('ceramic_local_storage');
  return !!ceramicStorage && ceramicStorage !== '{}';
};

// Function to extract Ceramic data from localStorage
export const extractCeramicData = (): Record<string, any[]> => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  
  // Get Ceramic storage
  const ceramicStorage = localStorage.getItem('ceramic_local_storage');
  return ceramicStorage ? JSON.parse(ceramicStorage) : {};
};
