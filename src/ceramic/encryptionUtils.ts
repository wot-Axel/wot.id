/**
 * Ceramic encryption utilities
 * 
 * Provides functions for encrypting and decrypting data stored in Ceramic
 */

import { randomBytes } from '@stablelib/random';
import { DID } from 'dids';

// Type definition for encrypted data
export interface EncryptedData {
  encryptedData: string;
  encryptedKey: string;
}

/**
 * Encrypt data for storage in Ceramic
 * 
 * @param data - Data to encrypt (will be JSON stringified)
 * @param did - DID instance to use for encryption
 * @returns EncryptedData containing encrypted data and key
 */
export async function encryptData(data: any, did: DID): Promise<EncryptedData> {
  if (!did) {
    throw new Error('DID is required for encryption');
  }

  try {
    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate random key for symmetric encryption
    const encryptionKey = randomBytes(32);
    
    // Create JWE with the DID as recipient
    const encryptedKey = await did.createJWE(encryptionKey, [did.id]);
    
    // Use the encryption key to encrypt the data
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(dataString);
    
    // For simplicity we're using did.createJWE for both key and data
    // In a production environment, you might want to use a more efficient
    // symmetric encryption for the data itself
    const encryptedData = await did.createJWE(dataBytes, [did.id]);
    
    return {
      encryptedData: JSON.stringify(encryptedData),
      encryptedKey: JSON.stringify(encryptedKey)
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data retrieved from Ceramic
 * 
 * @param encryptedData - The EncryptedData object from Ceramic
 * @param did - DID instance to use for decryption
 * @returns The decrypted data (parsed from JSON if possible)
 */
export async function decryptData(encryptedData: EncryptedData, did: DID): Promise<any> {
  if (!did) {
    throw new Error('DID is required for decryption');
  }

  try {
    // Parse the encrypted data and key
    const parsedEncryptedKey = JSON.parse(encryptedData.encryptedKey);
    const parsedEncryptedData = JSON.parse(encryptedData.encryptedData);
    
    // Decrypt the encryption key
    const decryptedKey = await did.decryptJWE(parsedEncryptedKey);
    
    // Decrypt the data using the decrypted key
    // For simplicity, we're using did.decryptJWE for both
    const decryptedData = await did.decryptJWE(parsedEncryptedData);
    
    // Convert decrypted data from Uint8Array to string
    const decoder = new TextDecoder();
    const dataString = decoder.decode(decryptedData);
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(dataString);
    } catch {
      return dataString;
    }
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}
