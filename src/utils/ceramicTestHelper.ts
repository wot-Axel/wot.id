/**
 * Ceramic Test Helper
 * 
 * This file provides helper functions for testing the Ceramic integration
 * with proper DID handling.
 */

import {
  DataType,
  CeramicClient,
  initCeramic
} from '../composedb/ceramic';
import { createDIDFromId } from '../composedb/did-helper';

/**
 * Create a mock Ceramic client for testing
 * This ensures the client has a properly typed DID
 */
export const createMockCeramic = (): CeramicClient => {
  return {
    did: createDIDFromId('did:key:test'),
    isOffline: true
  } as CeramicClient;
};

/**
 * Initialize a Ceramic client for testing
 * This ensures proper DID handling
 */
export const initTestCeramic = async (): Promise<CeramicClient> => {
  try {
    const ceramic = await initCeramic();
    return ceramic;
  } catch (error) {
    console.error('Failed to initialize Ceramic client:', error);
    // Return a mock client with a proper DID
    return createMockCeramic();
  }
};

/**
 * Get test data for a specific data type
 */
export const getTestData = (dataType: DataType): any => {
  const testData = {
    [DataType.PROFILE]: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    [DataType.DOCUMENTS]: {
      passport: 'AB123456',
      nationalId: 'ID12345678'
    },
    [DataType.MEDICAL]: {
      key: 'Blood Type',
      value: 'O+',
      unit: '',
      referenceRange: ''
    },
    [DataType.DIGITAL_ASSETS]: {
      name: 'CryptoPunk #1234',
      type: 'nft',
      platform: 'Ethereum',
      identifier: '1234'
    },
    [DataType.MESSAGES]: {
      sender: 'did:key:alice',
      recipient: 'did:key:bob',
      content: 'Hello, how are you?'
    }
  };

  return testData[dataType] || {};
};
