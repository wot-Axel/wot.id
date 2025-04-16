// Define common types for storage

import { TableType, TableData } from '@/utils/storageUtils';

// Data types supported by the application
export type DataType = 
  | 'profile'
  | 'documents'
  | 'digital_assets'
  | 'real_world_assets'
  | 'medical'
  | 'connections'
  | 'organizations'
  | 'messages'
  | 'private'
  | 'contacts'
  | 'affiliations'
  | 'currencies';

// Common storage item interface
export interface StorageItem {
  id: string;
  key: string;
  value: string;
  created_at?: string;
}

// Map DataType to TableType
export const mapDataTypeToTableType = (dataType: DataType): TableType => {
  switch (dataType) {
    case 'profile':
      return TableType.PRIVATE;
    case 'documents':
      return TableType.PRIVATE;
    case 'digital_assets':
      return TableType.DIGITAL_ASSETS;
    case 'real_world_assets':
      return TableType.PRIVATE;
    case 'medical':
      return TableType.MEDICAL;
    case 'connections':
      return TableType.CONTACTS;
    case 'organizations':
      return TableType.AFFILIATIONS;
    case 'messages':
      return TableType.MESSAGE;
    case 'private':
      return TableType.PRIVATE;
    case 'contacts':
      return TableType.CONTACTS;
    case 'affiliations':
      return TableType.AFFILIATIONS;
    case 'currencies':
      return TableType.PRIVATE;
    default:
      return TableType.PRIVATE;
  }
};
