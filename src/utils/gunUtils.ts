/**
 * Gun.js Storage Utilities
 * 
 * This module provides a decentralized storage interface using Gun.js.
 * It includes encryption for sensitive data and network resilience features.
 */

import Gun from 'gun';
import { TableType, TableData } from './storageUtils';
import { encryptData, decryptData } from './encryptionUtils';
import { registerPendingChange } from './syncUtils';

/**
 * Gun.js acknowledgment response type
 */
type GunAck = {
  err?: string;  // Error message if operation failed
  ok?: number;   // Success indicator (typically 1 if successful)
};

/**
 * Error type for Gun storage operations
 */
export class GunStorageError extends Error {
  public readonly code: string;
  public readonly operation: string;
  
  constructor(message: string, operation: string, code: string = 'STORAGE_ERROR') {
    super(message);
    this.name = 'GunStorageError';
    this.code = code;
    this.operation = operation;
  }
}

// Initialize Gun - this single instance will be shared across the application
let gun: any;

// Track connection status
let isOnline = true;
let reconnectTimer: any = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_OPERATION_RETRIES = 3;

/**
 * Initialize Gun database
 * @param peers Optional array of Gun peers to connect to
 * @returns Gun database instance
 */
export const initGun = (peers: string[] = []) => {
  // Only initialize once
  if (!gun) {
    try {
      // Default peers - can be overridden through the peers parameter
      // Using proven, reliable Gun relay servers
      // Remove WebSocket peer that was causing connection errors
      const defaultPeers = [
        'https://gun-relay.glitch.me/gun',
        'https://relay.peer.ooo/gun'
      ];

      // Use provided peers or fallback to defaults
      const gunPeers = peers.length > 0 ? peers : defaultPeers;
      
      // Initialize Gun with the peers
      gun = new Gun({
        peers: gunPeers,
        localStorage: true, // Enable localStorage persistence
        radisk: true, // Enable persistent storage on disk
        file: 'wot-id-gun', // Filename for storage
        multicast: false, // Disable WebRTC for increased reliability
        retry: 2000, // Retry interval for network issues
        axe: false, // Disable experimental features for stability
        WebSocket: false // Disable to prevent WebSocket connection errors
      });
      
      console.log('[STORAGE] Gun initialized with peers:', gunPeers);
      
      // Set up network monitoring
      setupNetworkMonitoring();
      
      // Initialize event listeners for debugging
      setupGunDebugListeners();
      
      // Import the sync system dynamically to avoid circular imports
      import('./syncUtils').then(syncUtils => {
        syncUtils.initSyncSystem();
      }).catch(err => {
        console.error('[STORAGE] Failed to initialize sync system:', err);
      });
    } catch (error) {
      console.error('[STORAGE] Gun initialization failed:', error);
      // Even if initialization fails, we'll create a fallback local-only instance
      gun = new Gun({
        localStorage: true,
        radisk: true,
        file: 'wot-id-gun-fallback'
      });
    }
  }
  
  return gun;
};

/**
 * Gun peer and event types for TypeScript
 */
type GunPeer = string;
type GunError = {
  err: string;
  [key: string]: any;
};

/**
 * Set up debug listeners for Gun.js
 */
const setupGunDebugListeners = () => {
  if (!gun) return;
  
  // Listen for connection events
  gun.on('hi', (peer: GunPeer) => {
    console.log(`[STORAGE] Connected to peer: ${peer}`);
  });
  
  gun.on('bye', (peer: GunPeer) => {
    console.log(`[STORAGE] Disconnected from peer: ${peer}`);
  });
  
  // Log any critical errors but don't crash
  gun.on('error', (err: GunError) => {
    console.error('[STORAGE] Gun error:', err);
  });
};

/**
 * Set up event listeners for network changes
 */
const setupNetworkMonitoring = () => {
  // Handle online/offline status
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
  
  // Initial check
  isOnline = navigator.onLine;
};

/**
 * Handle network status changes
 */
const handleNetworkChange = () => {
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  
  if (!wasOnline && isOnline) {
    console.log('[STORAGE] Network connection restored');
    // Try to sync when connection is restored
    if (gun) {
      console.log('[STORAGE] Syncing data...');
      // Reset connection attempts counter when back online
      connectionAttempts = 0;
    }
  } else if (wasOnline && !isOnline) {
    console.log('[STORAGE] Network connection lost, data will be stored locally');
  }
};

/**
 * Helper function to retry a Gun operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with the operation result
 */
async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = MAX_OPERATION_RETRIES): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff capped at 10 seconds
      console.log(`[STORAGE] Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after multiple retries');
};

/**
 * Get Gun database instance. Initializes it if it doesn't exist yet.
 * @returns Gun database instance
 */
export const getGun = () => {
  if (!gun) {
    return initGun();
  }
  return gun;
};

/**
 * Determine if data should be encrypted based on table type
 * @param tableType The type of table
 * @returns Whether to encrypt the data
 */
const shouldEncryptData = (tableType: TableType): boolean => {
  // Only encrypt private data
  return tableType === TableType.PRIVATE;
};

/**
 * Get encryption password for sensitive data
 * @returns A password for encryption/decryption
 */
const getEncryptionPassword = (): string => {
  // In production, this should be derived from user input or a secure source
  // This is a simplified approach for demonstration
  return 'wot-id-secure-encryption-key';
};

/**
 * Store an item in Gun DB with retries and error handling
 * @param tableType The type of table/collection
 * @param key The key for the item
 * @param value The value to store
 * @returns Promise with the stored item data
 */
export const storeGunItem = async (
  tableType: TableType, 
  key: string, 
  value: string
): Promise<TableData> => {
  return retryOperation(async () => {
    const db = getGun();
    if (!db) {
      throw new GunStorageError('Gun database not initialized', 'storeItem', 'GUN_NOT_INITIALIZED');
    }
    
    const id = Date.now().toString();
    const created_at = new Date().toISOString();
    
    // Encrypt value if needed
    let processedValue = value;
    if (shouldEncryptData(tableType)) {
      try {
        processedValue = await encryptData(value, getEncryptionPassword());
      } catch (error) {
        throw new GunStorageError(
          `Failed to encrypt data for ${tableType}`, 
          'encrypt', 
          'ENCRYPTION_FAILED'
        );
      }
    }
    
    // Create the data object with our standard TableData format
    const data: TableData = {
      id,
      item_key: key,
      item_value: processedValue,
      created_at
    };
    
    // Register with the sync system in case we're offline
    if (!navigator.onLine) {
      registerPendingChange(tableType, key, data);
    }
    
    return new Promise<TableData>((resolve, reject) => {
      const operationTimeout = setTimeout(() => {
        // If operation times out but we're offline, consider it a success locally
        if (!navigator.onLine) {
          console.log(`[STORAGE] Offline storage for ${tableType}:${key}`);
          resolve({
            ...data,
            item_value: value
          });
        } else {
          reject(new GunStorageError(
            `Store operation timed out for ${tableType}:${key}`, 
            'storeItem', 
            'OPERATION_TIMEOUT'
          ));
        }
      }, 5000);
      
      // Store in Gun under the table type and using the key
      db.get(tableType).get(key).put(data, (ack: GunAck) => {
        clearTimeout(operationTimeout);
        
        if (ack.err) {
          if (!navigator.onLine) {
            // When offline, still succeed locally but log the error
            console.warn(`[STORAGE] Offline store operation, will sync later: ${tableType}:${key}`);
            resolve({
              ...data,
              item_value: value
            });
          } else {
            reject(new GunStorageError(
              `Gun storage error: ${ack.err}`, 
              'storeItem', 
              'GUN_STORAGE_ERROR'
            ));
          }
        } else {
          // Return the original unencrypted value to the caller
          resolve({
            ...data,
            item_value: value
          });
        }
      });
    });
  });
};

/**
 * Get an item from Gun DB with retries and error handling
 * @param tableType The type of table/collection 
 * @param key The key for the item
 * @returns Promise with the item or null if not found
 */
export const getGunItem = async (
  tableType: TableType,
  key: string
): Promise<TableData | null> => {
  return retryOperation(async () => {
    const db = getGun();
    if (!db) {
      throw new GunStorageError('Gun database not initialized', 'getItem', 'GUN_NOT_INITIALIZED');
    }
    
    return new Promise<TableData | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new GunStorageError(
          `Timeout getting data for ${tableType}/${key}`, 
          'getItem', 
          'OPERATION_TIMEOUT'
        ));
      }, 5000); // 5 second timeout for item retrieval
      
      db.get(tableType).get(key).once(async (data: any) => {
        clearTimeout(timeout);
        
        if (!data) {
          resolve(null);
          return;
        }
        
        // Decrypt if needed
        if (shouldEncryptData(tableType) && data.item_value) {
          try {
            const decryptedValue = await decryptData(data.item_value, getEncryptionPassword());
            resolve({
              ...data,
              item_value: decryptedValue
            });
          } catch (error) {
            console.error(`[STORAGE] Failed to decrypt data for ${tableType}:`, error);
            // Return with encrypted value as fallback for resilience
            resolve(data as TableData);
          }
        } else {
          resolve(data as TableData);
        }
      });
    });
  });
};

/**
 * List all items for a specific table type with improved reliability
 * @param tableType The type of table/collection
 * @returns Promise with array of items
 */
export const listGunItems = async (tableType: TableType): Promise<TableData[]> => {
  return retryOperation(async () => {
    const db = getGun();
    if (!db) {
      throw new GunStorageError('Gun database not initialized', 'listItems', 'GUN_NOT_INITIALIZED');
    }
    
    const items: TableData[] = [];
    let itemLoadComplete = false;
    
    return new Promise<TableData[]>((resolve, reject) => {
      // Set a timeout for the entire operation
      const operationTimeout = setTimeout(() => {
        // If we have some items, return them even though the operation timed out
        if (items.length > 0) {
          console.warn(`[STORAGE] List operation timed out but returning ${items.length} items`);
          itemLoadComplete = true;
          processAndResolve();
        } else {
          reject(new GunStorageError(
            `Timeout listing data for ${tableType}`, 
            'listItems', 
            'OPERATION_TIMEOUT'
          ));
        }
      }, 10000); // 10 second timeout for listing
      
      db.get(tableType).map().once((data: any, key: string) => {
        if (data && !itemLoadComplete) {
          // Store the raw items for processing
          items.push(data as TableData);
        }
      });
      
      // Gun doesn't have a built-in "I'm done loading" event
      // So we use a timeout to give it time to fetch the data
      setTimeout(() => {
        if (!itemLoadComplete) {
          itemLoadComplete = true;
          processAndResolve();
        }
      }, 300); // Small delay to collect items
      
      // Process and resolve the promise with decrypted items if needed
      async function processAndResolve() {
        clearTimeout(operationTimeout);
        
        try {
          // If encrypted data, decrypt all items
          if (shouldEncryptData(tableType) && items.length > 0) {
            const decryptedItems = await Promise.all(
              items.map(async (item) => {
                try {
                  const decryptedValue = await decryptData(item.item_value, getEncryptionPassword());
                  return {
                    ...item,
                    item_value: decryptedValue
                  };
                } catch (error) {
                  console.error(`[STORAGE] Failed to decrypt item ${item.item_key}:`, error);
                  return item; // Return the original item on error for resilience
                }
              })
            );
            resolve(decryptedItems);
          } else {
            resolve(items);
          }
        } catch (error) {
          reject(new GunStorageError(
            `Error processing items for ${tableType}`, 
            'listItems', 
            'PROCESSING_ERROR'
          ));
        }
      }
    });
  });
};

/**
 * Delete an item from Gun DB with improved reliability
 * @param tableType The type of table/collection
 * @param key The key for the item
 * @returns Promise with success status
 */
export const deleteGunItem = async (
  tableType: TableType,
  key: string
): Promise<boolean> => {
  return retryOperation(async () => {
    const db = getGun();
    if (!db) {
      throw new GunStorageError('Gun database not initialized', 'deleteItem', 'GUN_NOT_INITIALIZED');
    }
    
    return new Promise<boolean>((resolve, reject) => {
      db.get(tableType).get(key).put(null, (ack: GunAck) => {
        if (ack.err) {
          reject(new GunStorageError(
            `Failed to delete item ${key} from ${tableType}: ${ack.err}`, 
            'deleteItem', 
            'GUN_DELETE_ERROR'
          ));
        } else {
          resolve(true);
        }
      });
    });
  }).catch(error => {
    // For delete operations, we log the error but don't fail the application
    console.error(`[STORAGE] Delete operation failed but suppressed:`, error);
    return false; // Return false instead of throwing for resilience
  });
};
