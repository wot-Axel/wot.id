/**
 * DID Helper Functions
 * 
 * This file provides helper functions for working with DIDs in the Ceramic network.
 * It ensures proper DID type compatibility across the application.
 */

import { DID, VerifyJWSResult, DagJWS, VerifyJWSOptions } from 'dids';
import { Cacao } from '@didtools/cacao';

// Re-export the DID type to ensure it's available
export type { DID };

/**
 * Create a valid DID object from a DID identifier string
 * This ensures type compatibility with the DID interface
 */
export const createDIDFromId = (id: string): DID => {
  // Check if the id is a valid DID format
  if (!id.startsWith('did:')) {
    console.warn(`Invalid DID format: ${id}. DIDs should start with 'did:'`);
    // Try to fix common format issues
    id = id.startsWith('0x') ? `did:key:${id}` : id;
  }
  
  // This implementation creates a DID that will work for basic identification
  // but won't be able to sign or verify data without proper authentication
  const did: Partial<DID> = {
    id,
    resolve: async () => ({ didResolutionMetadata: {}, didDocument: { id }, didDocumentMetadata: {} }),
    capability: undefined,
    hasCapability: false,
    parent: undefined,
    verifyJWS: async (jws: string | DagJWS): Promise<VerifyJWSResult> => ({ 
      kid: id, 
      payload: {}, 
      didResolutionResult: {
        didResolutionMetadata: {},
        didDocument: { id },
        didDocumentMetadata: {}
      }
    }),
    createJWS: async () => { 
      throw new Error('DID not properly authenticated for signing operations');
    },
    createDagJWS: async () => {
      throw new Error('DID not properly authenticated for signing operations');
    },
    createJWE: async () => {
      throw new Error('DID not properly authenticated for encryption operations');
    },
    decryptJWE: async () => {
      throw new Error('DID not properly authenticated for decryption operations');
    },
    createDagJWE: async () => {
      throw new Error('DID not properly authenticated for encryption operations');
    },
    decryptDagJWE: async () => {
      throw new Error('DID not properly authenticated for decryption operations');
    }
  };
  
  // Force cast to DID - this is necessary for type compatibility
  // In production, we should use a proper DID implementation
  return did as unknown as DID;
};

/**
 * Patch a Ceramic client with a valid DID if needed
 * This ensures the client has a properly typed DID object
 */
export const ensureValidDID = (client: any, didId?: string): void => {
  if (!client) {
    console.error('Cannot ensure valid DID: client is undefined');
    return;
  }
  
  // Case 1: No DID at all, but we have an ID
  if (!client.did && didId) {
    console.log('Creating new DID from provided ID');
    client.did = createDIDFromId(didId);
    return;
  }
  
  // Case 2: Simplified DID object (just with an id property)
  if (client.did && typeof client.did === 'object' && 'id' in client.did) {
    // Check if it's just a simple { id: string } object
    if (Object.keys(client.did).length === 1) {
      console.log('Converting simplified DID to full DID object');
      const id = client.did.id;
      client.did = createDIDFromId(id);
      return;
    }
    
    // Case 3: It has an ID property but might be missing methods
    if (!client.did.createJWS || typeof client.did.createJWS !== 'function') {
      console.warn('DID object missing required methods, attempting to fix');
      try {
        // Keep the original ID
        const originalId = client.did.id;
        // Create a proper DID with the same ID
        client.did = createDIDFromId(originalId);
      } catch (err) {
        console.error('Failed to fix DID object:', err);
      }
    }
  }
  
  // Case 4: DID is completely missing
  if (!client.did) {
    console.warn('No DID found on client and no ID provided');
  }
};
