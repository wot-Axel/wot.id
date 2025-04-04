/**
 * Encryption utilities for client-side encryption of sensitive data
 * This provides functionality to encrypt and decrypt data before storing in Ceramic
 */

import { monitorAsync } from './performanceMonitor';

// Default encryption settings
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATION_COUNT = 100000;

/**
 * Generate a cryptographic key from a password
 * @param password The password to derive the key from
 * @param salt The salt for key derivation (optional)
 * @returns The derived key and salt
 */
export const deriveKey = async (password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> => {
  return monitorAsync('deriveKey', 'encryptionUtils', async () => {
    // Generate a random salt if not provided
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    }
    
    // Convert password to a key
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import the password as a key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive a key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATION_COUNT,
        hash: 'SHA-256'
      },
      baseKey,
      { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
    
    return { key, salt };
  });
};

/**
 * Encrypt data with a password
 * @param data The data to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted data as a base64 string
 */
export const encryptData = async (data: any, password: string): Promise<string> => {
  return monitorAsync('encryptData', 'encryptionUtils', async () => {
    try {
      // Convert data to JSON string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate a random initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      
      // Derive a key from the password
      const { key, salt } = await deriveKey(password);
      
      // Encrypt the data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv
        },
        key,
        dataBuffer
      );
      
      // Combine salt, iv, and encrypted data
      const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  });
};

/**
 * Decrypt data with a password
 * @param encryptedData The encrypted data as a base64 string
 * @param password The password to decrypt with
 * @returns The decrypted data
 */
export const decryptData = async (encryptedData: string, password: string): Promise<any> => {
  return monitorAsync('decryptData', 'encryptionUtils', async () => {
    try {
      // Convert base64 to Uint8Array
      const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract salt, iv, and encrypted data
      const salt = encryptedBytes.slice(0, SALT_LENGTH);
      const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const data = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);
      
      // Derive the key from the password and salt
      const { key } = await deriveKey(password, salt);
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv
        },
        key,
        data
      );
      
      // Convert the decrypted data to a string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      
      // Parse JSON if possible
      try {
        return JSON.parse(decryptedString);
      } catch {
        // Return as string if not valid JSON
        return decryptedString;
      }
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data: Invalid password or corrupted data');
    }
  });
};

/**
 * Check if a string is encrypted
 * @param data The data to check
 * @returns Whether the data is encrypted
 */
export const isEncrypted = (data: string): boolean => {
  try {
    // Try to decode as base64
    const decoded = atob(data);
    
    // Check if it has the minimum length for salt + iv
    if (decoded.length < SALT_LENGTH + IV_LENGTH) {
      return false;
    }
    
    // This is a heuristic and not foolproof
    // For more accuracy, we could add a prefix to encrypted data
    return true;
  } catch {
    // Not valid base64
    return false;
  }
};

/**
 * Generate a secure random password
 * @param length The length of the password
 * @returns A secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(randomValues[i] % charset.length);
  }
  
  return password;
};
