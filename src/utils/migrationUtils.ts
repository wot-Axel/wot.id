/**
 * Migration utilities to help transition from localStorage to Gun.js
 */

import * as StorageUtils from './storageUtils';
import * as GunUtils from './gunUtils';
import { TableType, TableData } from './storageUtils';

/**
 * Get items directly from localStorage (legacy method)
 * This is only used during migration
 */
export const getLegacyLocalStorageItems = (tableType: TableType): TableData[] => {
  const items: TableData[] = [];
  const prefix = `wot-${tableType}-`;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            items.push(JSON.parse(data));
          } catch (e) {
            console.warn(`[MIGRATION] Could not parse item at key ${key}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('[MIGRATION] Error accessing localStorage:', error);
  }
  
  return items;
};

/**
 * Migrate data from localStorage to Gun.js
 * @param tableType Type of data table to migrate
 * @returns Promise with migration results
 */
export const migrateLocalStorageToGun = async (tableType: TableType): Promise<{
  migrated: number;
  skipped: number;
  errors: number;
}> => {
  try {
    // Initialize Gun
    GunUtils.initGun();
    
    // Statistics
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Get all items from localStorage
    let items: TableData[] = [];
    
    try {
      // Try to use the legacy localStorage function directly
      // These are special utils that only get used during migration
      items = await getLegacyLocalStorageItems(tableType);
    } catch (error) {
      console.error(`[MIGRATION] Error getting localStorage items for ${tableType}:`, error);
      return { migrated, skipped, errors: 1 };
    }
    
    console.log(`[MIGRATION] Found ${items.length} items in localStorage for ${tableType}`);
    
    // Process each item
    for (const item of items) {
      try {
        if (!item.item_key || item.item_value === undefined) {
          console.warn(`[MIGRATION] Skipping invalid item:`, item);
          skipped++;
          continue;
        }
        
        // Check if item already exists in Gun
        const existingItem = await GunUtils.getGunItem(tableType, item.item_key);
        
        if (existingItem) {
          // Item already exists in Gun, skip
          skipped++;
          continue;
        }
        
        // Store item in Gun
        await GunUtils.storeGunItem(tableType, item.item_key, item.item_value);
        migrated++;
      } catch (error) {
        console.error(`[MIGRATION] Error migrating item ${item.item_key}:`, error);
        errors++;
      }
    }
    
    return { migrated, skipped, errors };
  } catch (error) {
    console.error('[MIGRATION] Failed to migrate data:', error);
    throw error;
  }
};

/**
 * Check if migration is needed
 * @param tableType Type of data table to check
 * @returns Promise boolean indicating if migration is needed
 */
export const isMigrationNeeded = async (tableType: TableType): Promise<boolean> => {
  // If migration has already been marked as complete, skip
  if (hasMigrationRun()) {
    console.log('[MIGRATION] No migration needed - already completed');
    return false;
  }
  
  try {
    // Check if there are any items in localStorage for this table type
    // Use the direct localStorage method to avoid circular dependencies
    const localItems = getLegacyLocalStorageItems(tableType);
    
    // Only attempt Gun lookup if we have local items
    let gunItems: TableData[] = [];
    if (localItems.length > 0) {
      try {
        gunItems = await GunUtils.listGunItems(tableType);
      } catch (error) {
        console.warn('[MIGRATION] Could not check Gun items, assuming migration needed:', error);
      }
    }
    
    // Migration is needed if we have local items that aren't in Gun
    const migrationNeeded = localItems.length > 0 && localItems.length > gunItems.length;
    
    if (migrationNeeded) {
      console.log(`[MIGRATION] Migration needed for ${tableType}: ${localItems.length} local items, ${gunItems.length} Gun items`);
    } else if (localItems.length > 0) {
      console.log(`[MIGRATION] No migration needed for ${tableType}: all ${localItems.length} items already in Gun`);
    }
    
    return migrationNeeded;
  } catch (error) {
    console.error('[MIGRATION] Error checking migration status:', error);
    return false;
  }
};

/**
 * Add a migration status record to prevent repeated migrations
 */
export const markMigrationComplete = async (): Promise<void> => {
  try {
    localStorage.setItem('wot_id_migration_completed', 'true');
    localStorage.setItem('wot_id_migration_timestamp', new Date().toISOString());
  } catch (error) {
    console.error('[MIGRATION] Failed to mark migration as complete:', error);
  }
};

/**
 * Check if migration has been completed before
 */
export const hasMigrationRun = (): boolean => {
  try {
    // Check if migration has been completed
    return localStorage.getItem('wot_id_migration_completed') === 'true';
  } catch (error) {
    console.error('[MIGRATION] Error checking migration status:', error);
    return false;
  }
};
