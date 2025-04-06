/**
 * DID Fallback Helper Functions
 * 
 * This file provides fallback mechanisms for DID handling in Ceramic,
 * particularly useful in production environments or when authentication fails.
 */

import { DID } from 'dids';
import { createDIDFromId } from './did-helper';

/**
 * Check if a DID is properly authenticated and can sign data
 * @param did The DID to check
 * @returns True if the DID can sign, false otherwise
 */
export const canDIDSign = async (did: DID | undefined): Promise<boolean> => {
  if (!did) return false;
  
  try {
    // Try to create a minimal JWS to test signing capability
    await did.createJWS({ test: true });
    return true;
  } catch (err) {
    console.warn('DID cannot sign:', err);
    return false;
  }
};

/**
 * Creates a fallback DID for testing purposes
 * This should only be used in test environments
 * @returns A DID that can be used for testing
 */
export const createFallbackDID = (): DID => {
  // This creates a minimal DID that works for testing
  // It won't be able to sign or verify data properly
  const mockId = `did:key:${Date.now().toString(16)}`;
  return createDIDFromId(mockId);
};

/**
 * Attempts to recover a failed Ceramic client by providing a fallback DID
 * @param client The Ceramic client that failed authentication
 * @returns True if recovery was attempted, false otherwise
 */
export const attemptCeramicRecovery = (client: any): boolean => {
  if (!client) return false;
  
  try {
    console.warn('Attempting Ceramic client recovery with fallback DID');
    // Create a fallback DID for the client
    client.did = createFallbackDID();
    return true;
  } catch (err) {
    console.error('Failed to recover Ceramic client:', err);
    return false;
  }
};

/**
 * Creates a mock DID that can be used for testing
 * This is useful when running in environments where proper DID authentication is not possible
 * @param id Optional ID to use for the mock DID
 * @returns A mock DID object
 */
export const createMockDID = (id?: string): DID => {
  const mockId = id || `did:key:mock-${Date.now().toString(16)}`;
  return createDIDFromId(mockId);
};
