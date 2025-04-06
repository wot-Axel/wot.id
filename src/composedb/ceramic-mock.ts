/**
 * Ceramic Mock Implementation
 * 
 * This file provides a complete mock implementation of the Ceramic client
 * that works entirely offline using localStorage for persistence.
 * It's designed to be used in production when real Ceramic nodes are unavailable.
 */

import { CeramicClient as CeramicHttpClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { createDIDFromId } from './did-helper';
import { StreamID } from '@ceramicnetwork/streamid';
import { CeramicClient } from './ceramic';

// Type for stored documents
interface StoredDocument {
  id: string;
  streamId: string;
  controller: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// Local storage keys
const STORAGE_KEYS = {
  DOCUMENTS: 'ceramic_mock_documents',
  COLLECTIONS: 'ceramic_mock_collections',
  DID: 'ceramic_mock_did'
};

/**
 * Create a mock DID for the mock Ceramic client
 */
const createMockDID = (): DID => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    // Return a static mock DID for server-side rendering
    return createDIDFromId('did:key:mock-server-side');
  }

  // Check if we have a stored DID
  const storedDID = localStorage.getItem(STORAGE_KEYS.DID);
  if (storedDID) {
    return createDIDFromId(storedDID);
  }
  
  // Create a new mock DID
  const mockId = `did:key:mock-${Date.now().toString(16)}`;
  localStorage.setItem(STORAGE_KEYS.DID, mockId);
  return createDIDFromId(mockId);
};

/**
 * Generate a mock stream ID
 */
const generateMockStreamId = (): string => {
  return `mock-stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create a mock Ceramic client that works offline
 */
export const createMockCeramicClient = (): CeramicClient => {
  // Create a base client with a fake URL
  const mockClient = new CeramicHttpClient('https://ceramic-mock.local') as unknown as CeramicClient;
  
  // Set it as offline
  mockClient.isOffline = true;
  
  // Set a mock DID
  mockClient.did = createMockDID();
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  
  // Add mock methods for document operations
  (mockClient as any).createDocument = async (doctype: string, content: any) => {
    console.log(`[Mock Ceramic] Creating document of type ${doctype}`);
    
    // Create a new document
    const streamId = generateMockStreamId();
    const now = new Date().toISOString();
    const newDocument: StoredDocument = {
      id: streamId,
      streamId,
      controller: mockClient.did?.id || 'unknown',
      content,
      createdAt: now,
      updatedAt: now,
      tags: content.tags || []
    };
    
    // Only attempt to use localStorage in browser environment
    if (isBrowser) {
      // Get existing documents
      const storedDocumentsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]';
      const storedDocuments: StoredDocument[] = JSON.parse(storedDocumentsJson);
      
      // Store the document
      storedDocuments.push(newDocument);
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(storedDocuments));
    }
    
    // Return a mock document object that matches the Ceramic API
    return {
      id: streamId,
      content,
      metadata: {
        controllers: [mockClient.did?.id || 'unknown'],
        createdAt: now,
        updatedAt: now
      },
      state: {
        content,
        metadata: {
          controllers: [mockClient.did?.id || 'unknown'],
          createdAt: now,
          updatedAt: now
        }
      }
    };
  };
  
  // Add mock method for loading documents
  (mockClient as any).loadDocument = async (streamId: string | StreamID) => {
    console.log(`[Mock Ceramic] Loading document ${streamId}`);
    
    // For server-side rendering, return an empty document
    if (!isBrowser) {
      return {
        id: streamId.toString(),
        content: {},
        metadata: {
          controllers: ['server-side-mock'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        state: {
          content: {},
          metadata: {
            controllers: ['server-side-mock'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
    
    // Get existing documents
    const storedDocumentsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]';
    const storedDocuments: StoredDocument[] = JSON.parse(storedDocumentsJson);
    
    // Find the document
    const document = storedDocuments.find(doc => doc.streamId === streamId.toString());
    if (!document) {
      throw new Error(`Document not found: ${streamId}`);
    }
    
    // Return a mock document object
    return {
      id: document.streamId,
      content: document.content,
      metadata: {
        controllers: [document.controller],
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      },
      state: {
        content: document.content,
        metadata: {
          controllers: [document.controller],
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      }
    };
  };
  
  // Add a method to check if we're using the mock implementation
  (mockClient as any).isMockImplementation = true;
  
  return mockClient;
};

/**
 * Check if the environment should use the mock implementation
 */
export const shouldUseMockImplementation = (): boolean => {
  // During server-side rendering, return false to avoid browser API calls
  if (typeof window === 'undefined') {
    return false;
  }

  // Always use mock in production
  const isProduction = 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('127.0.0.1');
  
  return isProduction;
};

/**
 * Get all documents stored in the mock implementation
 */
export const getAllMockDocuments = (): StoredDocument[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  const storedDocumentsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]';
  return JSON.parse(storedDocumentsJson);
};

/**
 * Clear all mock data (useful for testing)
 */
export const clearMockData = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.COLLECTIONS);
  localStorage.removeItem(STORAGE_KEYS.DID);
};
