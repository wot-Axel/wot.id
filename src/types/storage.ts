// Define common types for storage

// (Removed: TableType, TableData from storageUtils)
// (TODO: Remove or replace all mapping functions that reference TableType.)

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
