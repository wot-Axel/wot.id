/**
 * TypeScript definitions for Ceramic integration
 */

// Ceramic client interface
export interface CeramicClient {
  did?: {
    id: string;
  };
  disconnect?: () => void;
}

// Data types enum
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  MEDICAL = 'medical',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  CONNECTIONS = 'connections',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}

// Content record interface
export interface ContentRecord {
  id: string;
  streamId: string;
  controller: string;
  createdAt: string;
  updatedAt: string;
  content: any;
  tags: string[];
}

// Collection information interface
export interface CollectionInfo {
  exists: boolean;
  collectionId: string;
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Performance log interface
export interface PerformanceLog {
  timestamp: string;
  operation: string;
  component: string;
  duration: number;
  metadata?: any;
}

// Performance stats interface
export interface PerformanceStats {
  operation: string;
  component: string;
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
}

// ComposeDB specific types

// ComposeDB client result interface
export interface ComposeDBResult {
  documentId: string;
  streamId: string;
  createdAt?: string;
  [key: string]: any;
}

// ComposeDB query result interface
export interface ComposeDBQueryResult {
  data: {
    [key: string]: {
      edges: {
        node: {
          id: string;
          controller: string;
          createdAt: string;
          updatedAt: string;
          content: any;
          tags?: string[];
          [key: string]: any;
        };
      }[];
    };
  };
}

// ComposeDB model interface
export interface ComposeDBModel {
  id: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}
