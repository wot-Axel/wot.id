/**
 * Encryption utilities for securing sensitive data
 * This provides client-side encryption using AES-GCM and PBKDF2
 */

import { monitorAsync } from './performanceMonitor.js';

// Constants for encryption
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const ENCRYPTION_MARKER = 'ENCRYPTED:';

/**
 * Derive a key from a password using PBKDF2
 * @param password The password to derive the key from
 * @param salt The salt for key derivation
 * @returns The derived key
 */
const deriveKey = async (password, salt) => {
  // Convert password to buffer
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import the password as a key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive the key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
};

/**
 * Encrypt data using AES-GCM
 * @param data The data to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted data as a string
 */
export const encryptData = async (data, password) => {
  return monitorAsync('encryptData', 'encryptionUtils', async () => {
    // Generate a random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive the key from the password
    const key = await deriveKey(password, salt);
    
    // Convert data to JSON string and then to buffer
    const dataStr = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(dataStr);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine salt, IV, and encrypted data
    const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedBuffer.byteLength);
    result.set(salt);
    result.set(iv, SALT_LENGTH);
    result.set(new Uint8Array(encryptedBuffer), SALT_LENGTH + IV_LENGTH);
    
    // Convert to base64 and add marker
    const base64 = btoa(String.fromCharCode(...result));
    return `${ENCRYPTION_MARKER}${base64}`;
  });
};

/**
 * Decrypt data using AES-GCM
 * @param encryptedData The encrypted data as a string
 * @param password The password to decrypt with
 * @returns The decrypted data
 */
export const decryptData = async (encryptedData, password) => {
  return monitorAsync('decryptData', 'encryptionUtils', async () => {
    // Check if the data is encrypted
    if (!isEncrypted(encryptedData)) {
      throw new Error('Data is not encrypted');
    }
    
    // Remove the encryption marker
    const base64 = encryptedData.substring(ENCRYPTION_MARKER.length);
    
    // Convert from base64 to buffer
    const encryptedBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    
    // Extract salt, IV, and encrypted data
    const salt = encryptedBuffer.slice(0, SALT_LENGTH);
    const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive the key from the password
    const key = await deriveKey(password, salt);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Convert buffer to string and parse JSON
    const decryptedStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedStr);
  });
};

/**
 * Check if data is encrypted
 * @param data The data to check
 * @returns Whether the data is encrypted
 */
export const isEncrypted = (data) => {
  return typeof data === 'string' && data.startsWith(ENCRYPTION_MARKER);
};

/**
 * Generate a random password
 * @param length The length of the password
 * @returns A random password
 */
export const generatePassword = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  
  return password;
};
