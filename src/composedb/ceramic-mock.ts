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
  
  // Add mock methods for document operations
  (mockClient as any).createDocument = async (doctype: string, content: any) => {
    console.log(`[Mock Ceramic] Creating document of type ${doctype}`);
    
    // Get existing documents
    const storedDocumentsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]';
    const storedDocuments: StoredDocument[] = JSON.parse(storedDocumentsJson);
    
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
    
    // Store the document
    storedDocuments.push(newDocument);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(storedDocuments));
    
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
  // Always use mock in production
  if (typeof window !== 'undefined') {
    const isProduction = 
      window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('127.0.0.1');
    
    return isProduction;
  }
  
  return false;
};

/**
 * Get all documents stored in the mock implementation
 */
export const getAllMockDocuments = (): StoredDocument[] => {
  const storedDocumentsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]';
  return JSON.parse(storedDocumentsJson);
};

/**
 * Clear all mock data (useful for testing)
 */
export const clearMockData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.COLLECTIONS);
};
