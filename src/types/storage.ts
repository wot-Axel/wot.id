// Define common types for storage

import { TableType, TableData } from '../utils/storageUtils';

// Data types supported by the application
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  CONNECTIONS = 'connections',
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private',
  CONTACTS = 'contacts',
  AFFILIATIONS = 'affiliations',
  CURRENCIES = 'currencies',
  DEFAULT = 'default'
}

// Common storage item interface
export interface StorageItem {
  id: string;
  key: string;
  value: string;
  created_at?: string;
}

// Map TableType to DataType - used for compatibility with storage systems
export function mapTableTypeToDataType(tableType: string): DataType {
  switch(tableType) {
    case 'profile':
      return DataType.PROFILE;
    case 'documents':
      return DataType.DOCUMENTS;
    case 'digital_assets':
      return DataType.DIGITAL_ASSETS;
    case 'connections':
      return DataType.CONNECTIONS;
    case 'organizations':
      return DataType.ORGANIZATIONS;
    default:
      return DataType.DEFAULT;
  }
}

// Map DataType to TableType
export const mapDataTypeToTableType = (dataType: DataType): TableType => {
  switch (dataType) {
    case DataType.PROFILE:
      return TableType.PRIVATE;
    case DataType.DOCUMENTS:
      return TableType.PRIVATE;
    case DataType.DIGITAL_ASSETS:
      return TableType.DIGITAL_ASSETS;
    case DataType.REAL_WORLD_ASSETS:
      return TableType.PRIVATE;
    case DataType.MEDICAL:
      return TableType.MEDICAL;
    case DataType.CONNECTIONS:
      return TableType.CONTACTS;
    case DataType.ORGANIZATIONS:
      return TableType.AFFILIATIONS;
    case DataType.MESSAGES:
      return TableType.MESSAGE;
    case DataType.PRIVATE:
      return TableType.PRIVATE;
    case DataType.CONTACTS:
      return TableType.CONTACTS;
    case DataType.AFFILIATIONS:
      return TableType.AFFILIATIONS;
    case DataType.CURRENCIES:
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};
