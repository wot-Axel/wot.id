/**
 * Ceramic Exports
 * 
 * This file exports all necessary Ceramic types and functions to avoid circular dependencies
 * and import conflicts.
 */

// Import from external libraries
import { CeramicClient as CeramicHttpClient } from '@ceramicnetwork/http-client';

// Import from internal modules
import { 
  connectToCeramic, 
  resetFailedNodes, 
  getConnectionStatus 
} from '../utils/ceramicConnector';
import { createDIDFromId } from './did-helper';

// Export DataType enum
export enum DataType {
  PROFILE = 'profile',
  DOCUMENTS = 'documents',
  DIGITAL_ASSETS = 'digital_assets',
  REAL_WORLD_ASSETS = 'real_world_assets',
  MEDICAL = 'medical',
  RELATIONSHIPS = 'relationships',
  ORGANIZATIONS = 'organizations',
  MESSAGES = 'messages',
  PRIVATE = 'private'
}

// Export interfaces
export interface CeramicDID {
  id: string;
  [key: string]: any;
}

export interface CeramicClient extends CeramicHttpClient {
  isOffline?: boolean;
}

export interface ContentRecord {
  id: string;
  streamId: string;
  controller: string;
  createdAt: string;
  updatedAt: string;
  content: any;
  tags?: string[];
}

export interface CollectionInfo {
  exists: boolean;
  collectionId: string;
}

// Export functions
export const initCeramic = async (identity?: string): Promise<CeramicClient> => {
  const ceramic = await connectToCeramic(identity);
  
  if (!ceramic) {
    console.error('Failed to connect to any Ceramic node. Using fallback local implementation.');
    // Return a minimal client for offline functionality
    return {
      did: createDIDFromId('did:key:placeholder'),
      isOffline: true
    } as unknown as CeramicClient;
  }
  
  return ceramic;
};

export const resetCeramicNodes = (): void => {
  resetFailedNodes();
  console.log('Reset failed Ceramic nodes. Will retry on next connection attempt.');
};

export const getCeramicStatus = (): {
  lastSuccessfulNode: string | null;
  failedNodes: string[];
} => {
  return getConnectionStatus();
};
