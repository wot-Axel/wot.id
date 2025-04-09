/**
 * Synchronization utilities for managing Gun.js data consistency
 * 
 * This module provides utilities to help manage data synchronization
 * between local storage and Gun.js peer network.
 */

import { TableType, TableData } from './storageUtils';
import { getGun, GunStorageError } from './gunUtils';

// Track sync status
let syncInProgress = false;
let lastSyncTime: number | null = null;
const SYNC_INTERVAL = 30000; // 30 seconds between automatic sync attempts
const pendingChanges: Map<string, TableData> = new Map();

/**
 * Register a pending change that needs to be synchronized
 * @param tableType The type of table
 * @param key The item key
 * @param data The data to be synchronized
 */
export const registerPendingChange = (tableType: TableType, key: string, data: TableData) => {
  const changeKey = `${tableType}:${key}`;
  pendingChanges.set(changeKey, data);
  
  // Automatically trigger sync if we're online
  if (navigator.onLine && !syncInProgress) {
    synchronizePendingChanges();
  }
};

/**
 * Process all pending changes and sync them to the Gun.js network
 * @returns Promise resolving to the number of successful syncs
 */
export const synchronizePendingChanges = async (): Promise<{ success: number; failed: number }> => {
  if (syncInProgress || pendingChanges.size === 0) {
    return { success: 0, failed: 0 };
  }
  
  syncInProgress = true;
  let successCount = 0;
  let failureCount = 0;
  
  try {
    const gun = getGun();
    if (!gun) {
      throw new Error('Gun not initialized');
    }
    
    const changes = Array.from(pendingChanges.entries());
    console.log(`[SYNC] Synchronizing ${changes.length} pending changes...`);
    
    for (const [changeKey, data] of changes) {
      const [tableType, key] = changeKey.split(':') as [TableType, string];
      
      try {
        // Write directly to Gun DB
        await new Promise<void>((resolve, reject) => {
          gun.get(tableType).get(key).put(data, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        // Remove from pending changes on success
        pendingChanges.delete(changeKey);
        successCount++;
      } catch (error) {
        console.error(`[SYNC] Failed to sync ${tableType}:${key}`, error);
        failureCount++;
      }
    }
    
    lastSyncTime = Date.now();
    return { success: successCount, failed: failureCount };
  } catch (error) {
    console.error('[SYNC] Synchronization failed:', error);
    return { success: successCount, failed: failureCount };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Initialize the sync system by setting up periodic sync
 */
export const initSyncSystem = () => {
  // Set up periodic sync
  setInterval(() => {
    if (navigator.onLine && !syncInProgress && pendingChanges.size > 0) {
      synchronizePendingChanges();
    }
  }, SYNC_INTERVAL);
  
  // Sync on regaining connectivity
  window.addEventListener('online', () => {
    console.log('[SYNC] Network connection restored, synchronizing...');
    if (pendingChanges.size > 0) {
      synchronizePendingChanges();
    }
  });
};

/**
 * Get the current sync status
 * @returns Object with sync status information
 */
export const getSyncStatus = () => {
  return {
    syncInProgress,
    lastSyncTime,
    pendingChangesCount: pendingChanges.size,
    isOnline: navigator.onLine
  };
};
